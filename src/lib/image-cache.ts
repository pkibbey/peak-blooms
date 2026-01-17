import { createClient } from "redis"

/**
 * Redis client for caching image search results
 * Designed for local development; connects to Redis server running locally
 */

let redisClient: ReturnType<typeof createClient> | null = null

/**
 * Get or create Redis client
 */
export async function getRedisClient() {
  if (redisClient) {
    return redisClient
  }

  const url = process.env.REDIS_URL || "redis://localhost:6379"

  redisClient = createClient({
    url,
  })

  // Optional: handle errors silently or via a proper logger in the future
  // redisClient.on("error", () => {})

  try {
    await redisClient.connect()
  } catch (err) {
    console.error("Redis connect error: ", err)
    // Failed to connect; continue without Redis
  }

  return redisClient
}

/**
 * Cache key for image search results
 * Format: image-search:{normalized-product-name}:{source}
 */
function getCacheKey(productName: string, source: string): string {
  const normalized = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return `image-search:${normalized}:${source}`
}

/**
 * Cache key for API quota information
 * Format: image-quota:{source}
 */
function getQuotaCacheKey(source: string): string {
  return `image-quota:${source}`
}

/**
 * Store image search results in Redis with TTL
 */
export async function cacheImageSearchResults(
  productName: string,
  source: string,
  results: ImageSearchResult[],
  ttlSeconds: number = 3600 // 1 hour default
) {
  try {
    const client = await getRedisClient()
    const key = getCacheKey(productName, source)
    await client.setEx(key, ttlSeconds, JSON.stringify(results))
  } catch (err) {
    // Silently fail; search results just won't be cached
  }
}

/**
 * Retrieve cached image search results
 */
export async function getCachedImageSearchResults(
  productName: string,
  source: string
): Promise<ImageSearchResult[] | null> {
  try {
    const client = await getRedisClient()
    const key = getCacheKey(productName, source)
    const cached = await client.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (err) {
    return null
  }
}

/**
 * Store API quota information in Redis
 */
export async function cacheApiQuota(
  source: string,
  quota: ApiQuotaInfo,
  ttlSeconds: number = 3600 // 1 hour default
) {
  try {
    const client = await getRedisClient()
    const key = getQuotaCacheKey(source)
    await client.setEx(key, ttlSeconds, JSON.stringify(quota))
  } catch (err) {
    // Silently fail
  }
}

/**
 * Retrieve cached API quota information
 */
export async function getCachedApiQuota(source: string): Promise<ApiQuotaInfo | null> {
  try {
    const client = await getRedisClient()
    const key = getQuotaCacheKey(source)
    const cached = await client.get(key)
    return cached ? JSON.parse(cached) : null
  } catch (err) {
    return null
  }
}

/**
 * Clear all image search caches (for development/testing)
 */
export async function clearImageCache() {
  try {
    const client = await getRedisClient()
    const keys = await client.keys("image-search:*")
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (err) {
    // Silently fail
  }
}

/**
 * Image search result from a single API
 */
export interface ImageSearchResult {
  url: string
  source: "pixabay" | "unsplash" | "pexels"
  title: string
  attribution: string
  width?: number
  height?: number
  // Unsplash-specific fields for proper attribution and ToS compliance
  photographerUrl?: string
  unsplashPhotoUrl?: string
  downloadUrl?: string // Unsplash download endpoint for tracking
}

/**
 * API quota information
 */
export interface ApiQuotaInfo {
  source: "pixabay" | "unsplash" | "pexels"
  remaining: number
  limit: number
  resetTime?: number // Unix timestamp when quota resets
}
