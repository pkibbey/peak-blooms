/**
 * Data Access Layer - Collections
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

// Types for collections
type ProductVariant = {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
  isBoxlot: boolean
  productId: string
  createdAt: Date
  updatedAt: Date
}

type ProductWithVariants = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  color: string | null
  collectionId: string
  featured: boolean
  createdAt: Date
  updatedAt: Date
  variants: ProductVariant[]
}

export type CollectionBasic = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export type CollectionWithProducts = CollectionBasic & {
  products: ProductWithVariants[]
}

/**
 * Apply price multiplier to products in a collection
 */
function applyMultiplierToCollection(
  collection: CollectionWithProducts,
  multiplier: number
): CollectionWithProducts {
  return {
    ...collection,
    products: collection.products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        price: adjustPrice(variant.price, multiplier),
      })),
    })),
  }
}

/**
 * Get all collections (basic info only, no products)
 */
export async function getAllCollections(): Promise<CollectionBasic[]> {
  return withTiming("getAllCollections", {}, async () => {
    return db.collection.findMany({
      orderBy: {
        name: "asc",
      },
    })
  })
}

/**
 * Get a collection by slug with its products
 * Returns null if not found
 */
export async function getCollectionBySlug(
  slug: string,
  priceMultiplier = 1.0
): Promise<CollectionWithProducts | null> {
  return withTiming(
    "getCollectionBySlug",
    slug,
    async () => {
      const collection = await db.collection.findUnique({
        where: { slug },
        include: {
          products: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              variants: true,
            },
          },
        },
      })

      if (!collection) return null
      return applyMultiplierToCollection(collection, priceMultiplier)
    },
    { logNotFound: true }
  )
}

/**
 * Get a collection by ID with its products
 * Returns null if not found
 */
export async function getCollectionById(
  id: string,
  priceMultiplier = 1.0
): Promise<CollectionWithProducts | null> {
  return withTiming(
    "getCollectionById",
    id,
    async () => {
      const collection = await db.collection.findUnique({
        where: { id },
        include: {
          products: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              variants: true,
            },
          },
        },
      })

      if (!collection) return null
      return applyMultiplierToCollection(collection, priceMultiplier)
    },
    { logNotFound: true }
  )
}

/**
 * Get all collection slugs (for static generation)
 */
export async function getAllCollectionSlugs(): Promise<Array<{ slug: string }>> {
  return withTiming("getAllCollectionSlugs", {}, async () => {
    return db.collection.findMany({
      select: { slug: true },
    })
  })
}
