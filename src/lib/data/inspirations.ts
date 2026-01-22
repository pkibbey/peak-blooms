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
 * Only returns inspirations that contain products with complete data (non-empty image and description)
 */
export async function getInspirationsWithCounts(): Promise<InspirationBasic[]> {
  return withTiming("getInspirationsWithCounts", {}, async () => {
    return db.inspiration.findMany({
      where: {
        products: {
          every: {
            product: {
              AND: [{ description: { not: null } }, { images: { isEmpty: false } }],
            },
          },
        },
      },
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

      // Filter out soft-deleted products and products with missing description or images
      const filteredInspiration = {
        ...inspiration,
        products: inspiration.products.filter(
          (p) =>
            p.product.deletedAt === null &&
            p.product.description !== null &&
            p.product.description !== "" &&
            p.product.images.length > 0
        ),
      }

      return applyMultiplierToInspiration(filteredInspiration, priceMultiplier)
    },
    { logNotFound: true }
  )
}
