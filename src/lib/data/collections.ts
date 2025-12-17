/**
 * Data Access Layer - Collections
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { db } from "@/lib/db"
import type { CollectionBasicWithCount, CollectionWithProducts } from "@/lib/types/prisma"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

/**
 * Apply price multiplier to products in a collection
 */
function applyMultiplierToCollection(
  collection: CollectionWithProducts,
  multiplier: number
): CollectionWithProducts {
  return {
    ...collection,
    productCollections: collection.productCollections.map((pc) => ({
      ...pc,
      product: {
        ...pc.product,
        price: adjustPrice(pc.product.price, multiplier),
      },
    })),
  }
}

/**
 * Get all collections (basic info only, no products)
 */
export async function getAllCollections(): Promise<CollectionBasicWithCount[]> {
  return withTiming("getAllCollections", {}, async () => {
    return db.collection.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { productCollections: true } } },
    })
  })
}

/**
 * Get featured collections (basic info only, no products)
 */
export async function getFeaturedCollections(): Promise<CollectionBasicWithCount[]> {
  return withTiming("getFeaturedCollections", {}, async () => {
    return db.collection.findMany({
      where: { featured: true },
      orderBy: { name: "asc" },
      include: { _count: { select: { productCollections: true } } },
    })
  })
}

/**
 * Get a collection by slug with its products
 * Returns null if not found
 * Excludes soft-deleted products from the collection
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
          productCollections: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              product: true,
            },
          },
        },
      })

      if (!collection) return null

      // Filter out productCollections where the product is soft-deleted
      const filteredCollection = {
        ...collection,
        productCollections: collection.productCollections.filter(
          (pc) => pc.product.deletedAt === null
        ),
      }

      return applyMultiplierToCollection(filteredCollection, priceMultiplier)
    },
    { logNotFound: true }
  )
}
