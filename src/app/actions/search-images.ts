"use server"

import { getSession } from "@/lib/auth"
import {
  type ApiQuotaInfo,
  cacheApiQuota,
  cacheImageSearchResults,
  getCachedApiQuota,
  getCachedImageSearchResults,
  type ImageSearchResult,
} from "@/lib/image-cache"

import { wrapAction } from "@/server/error-handler"

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY
const UNSPLASH_API_KEY = process.env.UNSPLASH_API_KEY
const PEXELS_API_KEY = process.env.PEXELS_API_KEY

/**
 * Search multiple image APIs for product images
 * Queries Pixabay, Unsplash, and Pexels in parallel
 * Returns results with quota information for each API
 */
export const searchProductImages = wrapAction(
  async (productName: string, productType: string): Promise<ImageSearchResults> => {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("You must be an admin to search for images")
    }

    const searchQuery = `${productName} ${productType} flower plant`

    // Create a normalized cache key per product so results are unique per product
    const cacheKey = `${productName} ${productType}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")

    // Run all searches in parallel and pass the product-specific cache key
    const [pixabayResults, unsplashResults, pexelsResults] = await Promise.all([
      searchPixabay(searchQuery, cacheKey),
      searchUnsplash(searchQuery, cacheKey),
      searchPexels(searchQuery, cacheKey),
    ])

    return {
      pixabay: pixabayResults,
      unsplash: unsplashResults,
      pexels: pexelsResults,
    }
  }
)

/**
 * Search Pixabay API
 */
async function searchPixabay(
  query: string,
  cacheKey: string
): Promise<{
  images: ImageSearchResult[]
  quota: ApiQuotaInfo
}> {
  if (!PIXABAY_API_KEY) {
    return {
      images: [],
      quota: {
        source: "pixabay",
        remaining: 0,
        limit: 0,
      },
    }
  }

  try {
    // Check cache first
    const cached = await getCachedImageSearchResults(cacheKey, "pixabay")
    if (cached && cached.length > 0) {
      const quotaCache = await getCachedApiQuota("pixabay")
      if (quotaCache) {
        return {
          images: cached,
          quota: quotaCache,
        }
      }
    }

    const url = new URL("https://pixabay.com/api/")
    url.searchParams.append("key", PIXABAY_API_KEY)
    url.searchParams.append("q", query)
    url.searchParams.append("image_type", "photo")
    url.searchParams.append("safesearch", "true")
    url.searchParams.append("per_page", "9")
    url.searchParams.append("min_width", "400")

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Peak-Blooms/1.0" },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Pixabay API error: ${response.status}`)
    }

    const data = (await response.json()) as PixabayResponse
    const remaining = parseInt(response.headers.get("x-ratelimit-remaining") || "0")
    const limit = parseInt(response.headers.get("x-ratelimit-limit") || "50")

    const quota: ApiQuotaInfo = {
      source: "pixabay",
      remaining,
      limit,
    }

    const images: ImageSearchResult[] = (data.hits || []).map((hit) => ({
      url: hit.webformatURL,
      source: "pixabay",
      title: `Pixabay #${hit.id}`,
      attribution: `Photo by ${hit.user}`,
      width: hit.webformatWidth,
      height: hit.webformatHeight,
    }))

    // Cache results
    await cacheImageSearchResults(cacheKey, "pixabay", images, 3600)
    await cacheApiQuota("pixabay", quota, 3600)

    return { images, quota }
  } catch (err) {
    console.error("Pixabay search error:", err)
    return {
      images: [],
      quota: {
        source: "pixabay",
        remaining: 0,
        limit: 0,
      },
    }
  }
}

/**
 * Search Unsplash API
 * NOTE: Returns hotlinked URLs per Unsplash ToS - images are not downloaded/cached
 * Download tracking is triggered when image is selected by user
 */
async function searchUnsplash(
  query: string,
  cacheKey: string
): Promise<{
  images: ImageSearchResult[]
  quota: ApiQuotaInfo
}> {
  if (!UNSPLASH_API_KEY) {
    return {
      images: [],
      quota: {
        source: "unsplash",
        remaining: 0,
        limit: 0,
      },
    }
  }

  try {
    const cached = await getCachedImageSearchResults(cacheKey, "unsplash")
    if (cached && cached.length > 0) {
      const quotaCache = await getCachedApiQuota("unsplash")
      if (quotaCache) {
        return {
          images: cached,
          quota: quotaCache,
        }
      }
    }

    const url = new URL("https://api.unsplash.com/search/photos")
    url.searchParams.append("query", query)
    url.searchParams.append("per_page", "9")
    url.searchParams.append("client_id", UNSPLASH_API_KEY)

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "Peak-Blooms/1.0" },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = (await response.json()) as UnsplashResponse
    const remaining = parseInt(response.headers.get("x-ratelimit-remaining") || "0")
    const limit = parseInt(response.headers.get("x-ratelimit-limit") || "50")

    const quota: ApiQuotaInfo = {
      source: "unsplash",
      remaining,
      limit,
    }

    const images: ImageSearchResult[] = (data.results || []).map((photo) => ({
      url: photo.urls.regular,
      source: "unsplash",
      title: photo.alt_description || "Unsplash Photo",
      attribution: `Photo by ${photo.user.name} on Unsplash`,
      photographerUrl: photo.user.portfolio_url || photo.user.links.html,
      unsplashPhotoUrl: photo.links.html,
      downloadUrl: photo.links.download_location,
      width: photo.width,
      height: photo.height,
    }))

    await cacheImageSearchResults(cacheKey, "unsplash", images, 3600)
    await cacheApiQuota("unsplash", quota, 3600)

    return { images, quota }
  } catch (err) {
    console.error("Unsplash search error:", err)
    return {
      images: [],
      quota: {
        source: "unsplash",
        remaining: 0,
        limit: 0,
      },
    }
  }
}

/**
 * Search Pexels API
 */
async function searchPexels(
  query: string,
  cacheKey: string
): Promise<{
  images: ImageSearchResult[]
  quota: ApiQuotaInfo
}> {
  if (!PEXELS_API_KEY) {
    return {
      images: [],
      quota: {
        source: "pexels",
        remaining: 0,
        limit: 0,
      },
    }
  }

  try {
    const cached = await getCachedImageSearchResults(cacheKey, "pexels")
    if (cached && cached.length > 0) {
      const quotaCache = await getCachedApiQuota("pexels")
      if (quotaCache) {
        return {
          images: cached,
          quota: quotaCache,
        }
      }
    }

    const url = new URL("https://api.pexels.com/v1/search")
    url.searchParams.append("query", query)
    url.searchParams.append("per_page", "9")

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: PEXELS_API_KEY,
        "User-Agent": "Peak-Blooms/1.0",
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = (await response.json()) as PexelsResponse
    const remaining = parseInt(response.headers.get("x-ratelimit-remaining") || "0")
    const limit = parseInt(response.headers.get("x-ratelimit-limit") || "200")

    const quota: ApiQuotaInfo = {
      source: "pexels",
      remaining,
      limit,
    }

    const images: ImageSearchResult[] = (data.photos || []).map((photo) => ({
      url: photo.src.medium,
      source: "pexels",
      title: `Pexels #${photo.id}`,
      attribution: `Photo by ${photo.photographer}`,
      width: photo.width,
      height: photo.height,
    }))

    await cacheImageSearchResults(cacheKey, "pexels", images, 3600)
    await cacheApiQuota("pexels", quota, 3600)

    return { images, quota }
  } catch (err) {
    console.error("Pexels search error:", err)
    return {
      images: [],
      quota: {
        source: "pexels",
        remaining: 0,
        limit: 0,
      },
    }
  }
}

/**
 * Response types for image APIs
 */

interface PixabayResponse {
  hits: Array<{
    id: number
    webformatURL: string
    webformatWidth: number
    webformatHeight: number
    user: string
  }>
}

interface UnsplashResponse {
  results: Array<{
    urls: {
      regular: string
    }
    width: number
    height: number
    alt_description: string
    user: {
      name: string
      portfolio_url: string | null
      links: {
        html: string
      }
    }
    links: {
      html: string
      download_location: string
    }
  }>
}

interface PexelsResponse {
  photos: Array<{
    id: number
    src: {
      medium: string
    }
    width: number
    height: number
    photographer: string
  }>
}

interface ImageSearchResults {
  pixabay: {
    images: ImageSearchResult[]
    quota: ApiQuotaInfo
  }
  unsplash: {
    images: ImageSearchResult[]
    quota: ApiQuotaInfo
  }
  pexels: {
    images: ImageSearchResult[]
    quota: ApiQuotaInfo
  }
}

/**
 * Server action to trigger Unsplash download endpoint
 * Required by Unsplash ToS when a photo is downloaded/used
 * This logs the download and credits the photographer
 */
export const triggerUnsplashDownload = wrapAction(async (downloadUrl: string): Promise<null> => {
  const session = await getSession()
  if (!session?.user) {
    throw new Error("Unauthorized")
  }

  // Trigger the download endpoint as required by Unsplash ToS
  await fetch(downloadUrl, {
    method: "GET",
    signal: AbortSignal.timeout(5000),
  })

  return null
})
