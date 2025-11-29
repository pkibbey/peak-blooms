/**
 * Data Access Layer - Inspirations
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

// Types for inspirations
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

type InspirationProductJoin = {
  id: string
  inspirationId: string
  productId: string
  productVariantId: string
  quantity: number
  createdAt: Date
  product: ProductWithVariants
  productVariant: ProductVariant | null
}

export type InspirationBasic = {
  id: string
  name: string
  slug: string
  subtitle: string
  image: string
  excerpt: string
  inspirationText: string
  createdAt: Date
  updatedAt: Date
}

export type InspirationWithProducts = InspirationBasic & {
  products: InspirationProductJoin[]
}

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
        variants: sp.product.variants.map((variant) => ({
          ...variant,
          price: adjustPrice(variant.price, multiplier),
        })),
      },
      productVariant: sp.productVariant
        ? {
            ...sp.productVariant,
            price: adjustPrice(sp.productVariant.price, multiplier),
          }
        : null,
    })),
  }
}

/**
 * Get all inspirations (basic info only)
 */
export async function getAllInspirations(): Promise<InspirationBasic[]> {
  return withTiming("getAllInspirations", {}, async () => {
    return db.inspiration.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })
  })
}

/**
 * Get all inspirations with product counts
 */
export async function getInspirationsWithCounts(): Promise<
  Array<InspirationBasic & { _count: { products: number } }>
> {
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
              product: {
                include: { variants: true },
              },
              productVariant: true,
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

/**
 * Get an inspiration by ID with all products
 * Returns null if not found
 */
export async function getInspirationById(
  id: string,
  priceMultiplier = 1.0
): Promise<InspirationWithProducts | null> {
  return withTiming(
    "getInspirationById",
    id,
    async () => {
      const inspiration = await db.inspiration.findUnique({
        where: { id },
        include: {
          products: {
            include: {
              product: {
                include: { variants: true },
              },
              productVariant: true,
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

/**
 * Get all inspiration slugs (for static generation)
 */
export async function getAllInspirationSlugs(): Promise<Array<{ slug: string }>> {
  return withTiming("getAllInspirationSlugs", {}, async () => {
    return db.inspiration.findMany({
      select: { slug: true },
    })
  })
}
