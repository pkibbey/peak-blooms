/**
 * Data Access Layer - Products
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { db } from "@/lib/db"
import type {
  ProductVariantWhereInput,
  ProductWhereInput,
  ProductWithInspirations,
  ProductWithVariants,
  ProductWithVariantsAndCollection,
} from "@/lib/types/prisma"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

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

interface GetProductsOptions {
  collectionId?: string
  featured?: boolean
  colors?: string[]
  stemLengthMin?: number
  stemLengthMax?: number
  priceMin?: number
  priceMax?: number
  boxlotOnly?: boolean
  search?: string
  limit?: number
  offset?: number
}

interface GetProductsResult {
  products: ProductWithVariantsAndCollection[]
  total: number
  limit: number
  offset: number
}

/**
 * Get multiple products with optional filters and pagination
 * Prices are automatically adjusted by the provided multiplier
 */
export async function getProducts(
  options: GetProductsOptions = {},
  priceMultiplier = 1.0
): Promise<GetProductsResult> {
  return withTiming("getProducts", options as Record<string, unknown>, async () => {
    // Use a flexible typed placeholder for `where` so we can add new array filters
    const where = {} as unknown as ProductWhereInput

    if (options.collectionId) {
      where.collectionId = options.collectionId
    }

    if (options.featured) {
      where.featured = true
    }

    // Accept a colors array for filtering; find products that contain at least one of the values
    if (options.colors) {
      where.colors = { hasSome: options.colors }
    }

    // Search by product name or description (case-insensitive)
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
      ]
    }

    // Build variant filters
    const variantFilter: ProductVariantWhereInput = {}

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

    // Set default pagination values
    const limit = options.limit ?? 12
    const offset = options.offset ?? 0

    // Get total count for pagination metadata
    const total = await db.product.count({ where })

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
      take: limit,
      skip: offset,
    })

    return {
      products: applyMultiplierToProducts(products, priceMultiplier),
      total,
      limit,
      offset,
    }
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
  const result = await getProducts({ featured: true, limit }, priceMultiplier)
  return result.products
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

/**
 * Get available filter options for the shop page
 * Returns all unique colors and collections
 */
export async function getShopFilterOptions(): Promise<{
  colors: string[]
  collections: Array<{ id: string; name: string }>
}> {
  return withTiming("getShopFilterOptions", {}, async () => {
    // Get all unique colors from products
    const products = await db.product.findMany({
      select: { colors: true },
    })
    const colorsSet = new Set<string>()
    products.forEach((product) => {
      product.colors.forEach((color) => {
        colorsSet.add(color)
      })
    })
    const colors = Array.from(colorsSet).sort()

    // Get all collections
    const collections = await db.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { colors, collections }
  })
}
