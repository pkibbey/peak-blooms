/**
 * Data Access Layer - Inspirations
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { db } from "@/lib/db"
import type { InspirationBasic, InspirationWithProducts } from "@/lib/query-types"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

/**
 * Apply price multiplier to inspiration products
 */
function applyMultiplierToInspiration(
  inspiration: InspirationWithProducts,
  multiplier: number
): InspirationWithProducts {
  return {
    ...inspiration,
    products: inspiration.products.map((sp) => ({
      ...sp,
      product: {
        ...sp.product,
        price: adjustPrice(sp.product.price, multiplier),
      },
    })),
  }
}

/**
 * Get all inspirations with product counts
 */
export async function getInspirationsWithCounts(): Promise<InspirationBasic[]> {
  return withTiming("getInspirationsWithCounts", {}, async () => {
    return db.inspiration.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })
  })
}

/**
 * Get an inspiration by slug with all products
 * Returns null if not found
 */
export async function getInspirationBySlug(
  slug: string,
  priceMultiplier = 1.0
): Promise<InspirationWithProducts | null> {
  return withTiming(
    "getInspirationBySlug",
    slug,
    async () => {
      const inspiration = await db.inspiration.findUnique({
        where: { slug },
        include: {
          products: {
            include: {
              product: true,
            },
          },
        },
      })

      if (!inspiration) return null
      return applyMultiplierToInspiration(inspiration, priceMultiplier)
    },
    { logNotFound: true }
  )
}
