/**
 * Data Access Layer - Products
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

// Base types for variants
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

type Collection = {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  createdAt: Date
  updatedAt: Date
}

type InspirationCount = {
  _count: { products: number }
}

type InspirationProductJoin = {
  inspiration: {
    id: string
    name: string
    slug: string
    subtitle: string
    image: string
    inspirationText: string
    createdAt: Date
    updatedAt: Date
  } & InspirationCount
}

// Types for products with variants
export type ProductWithVariants = {
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

export type ProductWithVariantsAndCollection = ProductWithVariants & {
  collection: Collection
}

export type ProductWithInspirations = ProductWithVariantsAndCollection & {
  inspirations: InspirationProductJoin[]
}

/**
 * Apply price multiplier to a single product's variants
 */
function applyMultiplierToProduct<T extends ProductWithVariants>(
  product: T,
  multiplier: number
): T {
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: adjustPrice(variant.price, multiplier),
    })),
  }
}

/**
 * Apply price multiplier to an array of products
 */
function applyMultiplierToProducts<T extends ProductWithVariants>(
  products: T[],
  multiplier: number
): T[] {
  return products.map((product) => applyMultiplierToProduct(product, multiplier))
}

/**
 * Get a single product by slug with variants
 * Returns null if not found
 */
export async function getProductBySlug(
  slug: string,
  priceMultiplier = 1.0
): Promise<ProductWithVariantsAndCollection | null> {
  return withTiming(
    "getProductBySlug",
    slug,
    async () => {
      const product = await db.product.findUnique({
        where: { slug },
        include: {
          variants: true,
          collection: true,
        },
      })

      if (!product) return null
      return applyMultiplierToProduct(product, priceMultiplier)
    },
    { logNotFound: true }
  )
}

/**
 * Get a single product by ID with variants
 * Returns null if not found
 */
export async function getProductById(
  id: string,
  priceMultiplier = 1.0
): Promise<ProductWithVariants | null> {
  return withTiming(
    "getProductById",
    id,
    async () => {
      const product = await db.product.findUnique({
        where: { id },
        include: {
          variants: true,
        },
      })

      if (!product) return null
      return applyMultiplierToProduct(product, priceMultiplier)
    },
    { logNotFound: true }
  )
}

export interface GetProductsOptions {
  collectionId?: string
  featured?: boolean
  color?: string
  stemLengthMin?: number
  stemLengthMax?: number
  priceMin?: number
  priceMax?: number
  boxlotOnly?: boolean
  limit?: number
}

/**
 * Get multiple products with optional filters
 * Prices are automatically adjusted by the provided multiplier
 */
export async function getProducts(
  options: GetProductsOptions = {},
  priceMultiplier = 1.0
): Promise<ProductWithVariantsAndCollection[]> {
  return withTiming("getProducts", options as Record<string, unknown>, async () => {
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where input type
    const where: Record<string, any> = {}

    if (options.collectionId) {
      where.collectionId = options.collectionId
    }

    if (options.featured) {
      where.featured = true
    }

    if (options.color) {
      where.color = {
        equals: options.color,
        mode: "insensitive",
      }
    }

    // Build variant filters
    // biome-ignore lint/suspicious/noExplicitAny: Prisma where input type
    const variantFilter: Record<string, any> = {}

    if (options.stemLengthMin !== undefined || options.stemLengthMax !== undefined) {
      variantFilter.stemLength = {}
      if (options.stemLengthMin !== undefined) {
        variantFilter.stemLength.gte = options.stemLengthMin
      }
      if (options.stemLengthMax !== undefined) {
        variantFilter.stemLength.lte = options.stemLengthMax
      }
    }

    if (options.priceMin !== undefined || options.priceMax !== undefined) {
      variantFilter.price = {}
      if (options.priceMin !== undefined) {
        variantFilter.price.gte = options.priceMin
      }
      if (options.priceMax !== undefined) {
        variantFilter.price.lte = options.priceMax
      }
    }

    if (options.boxlotOnly) {
      variantFilter.isBoxlot = true
    }

    if (Object.keys(variantFilter).length > 0) {
      where.variants = { some: variantFilter }
    }

    const products = await db.product.findMany({
      where,
      include: {
        collection: true,
        variants: options.boxlotOnly
          ? {
              where: { isBoxlot: true },
            }
          : true,
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(options.limit && { take: options.limit }),
    })

    return applyMultiplierToProducts(products, priceMultiplier)
  })
}

/**
 * Get featured products
 * Convenience wrapper around getProducts
 */
export async function getFeaturedProducts(
  priceMultiplier = 1.0,
  limit?: number
): Promise<ProductWithVariantsAndCollection[]> {
  return getProducts({ featured: true, limit }, priceMultiplier)
}

/**
 * Get all products (for static generation)
 * Note: No price multiplier applied - use for generateStaticParams
 */
export async function getAllProductSlugs(): Promise<Array<{ slug: string }>> {
  return withTiming("getAllProductSlugs", {}, async () => {
    return db.product.findMany({
      select: { slug: true },
    })
  })
}

/**
 * Get a product by slug with variants, collection, and inspirations
 * Used for product detail pages
 * Returns null if not found
 */
export async function getProductWithInspirations(
  slug: string,
  priceMultiplier = 1.0
): Promise<ProductWithInspirations | null> {
  return withTiming(
    "getProductWithInspirations",
    slug,
    async () => {
      const product = await db.product.findUnique({
        where: { slug },
        include: {
          collection: true,
          inspirations: {
            include: {
              inspiration: {
                include: {
                  _count: {
                    select: { products: true },
                  },
                },
              },
            },
          },
          variants: true,
        },
      })

      if (!product) return null
      return applyMultiplierToProduct(product, priceMultiplier)
    },
    { logNotFound: true }
  )
}
