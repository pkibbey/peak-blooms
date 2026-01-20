/**
 * Data Access Layer - Products
 * Centralized data fetching with automatic price multiplier application and logging
 */

import { ProductType } from "@/generated/enums"
import type { ProductWhereInput } from "@/generated/models"
import { ITEMS_PER_PAGE } from "@/lib/consts"
import { db } from "@/lib/db"
import type { ProductWithCollections, ProductWithInspirations } from "@/lib/query-types"
import { adjustPrice } from "@/lib/utils"
import { withTiming } from "./logger"

/**
 * Apply price multiplier to a single product
 */
function applyMultiplierToProduct<T extends { price: number; [key: string]: unknown }>(
  product: T,
  multiplier: number
): T {
  return {
    ...product,
    price: adjustPrice(product.price, multiplier),
  }
}

/**
 * Apply price multiplier to an array of products
 */
function applyMultiplierToProducts<T extends { price: number; [key: string]: unknown }>(
  products: T[],
  multiplier: number
): T[] {
  return products.map((product) => applyMultiplierToProduct(product, multiplier))
}

/**
 * Get multiple products with optional filters and pagination
 * Prices are automatically adjusted by the provided multiplier
 */
export async function getProducts(
  options: {
    collectionIds?: string[]
    featured?: boolean
    colors?: string[]
    priceMin?: number
    priceMax?: number
    search?: string
    filterDescription?: "has" | "missing"
    filterImages?: "has" | "missing"
    productType?: string
    types?: string[]
    limit?: number
    offset?: number
    sort?: string
    order?: "asc" | "desc"
  } = {},
  priceMultiplier = 1.0
): Promise<{ products: ProductWithCollections[]; total: number; limit: number; offset: number }> {
  return withTiming("getProducts", options as Record<string, unknown>, async () => {
    // Build the where clause for filtering
    const where: ProductWhereInput = {}

    // Always exclude soft-deleted products
    where.deletedAt = null

    if (options.collectionIds && options.collectionIds.length > 0) {
      where.productCollections = {
        some: {
          collectionId: {
            in: options.collectionIds,
          },
        },
      }
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

    // Filter by description status
    if (options.filterDescription === "has") {
      where.AND = [{ description: { not: null } }, { description: { not: "" } }]
    } else if (options.filterDescription === "missing") {
      where.OR = [{ description: null }, { description: "" }]
    }

    // Filter by image status
    if (options.filterImages === "has") {
      where.images = { isEmpty: false }
    } else if (options.filterImages === "missing") {
      where.images = { isEmpty: true }
    }

    // Filter by specific product type(s)
    if (options.types && options.types.length > 0) {
      where.productType = {
        in: options.types.map((t: string) => ProductType[t as keyof typeof ProductType]),
      }
    } else if (options.productType) {
      where.productType = ProductType[options.productType as keyof typeof ProductType]
    }

    // Price filtering on the product itself
    if (options.priceMin !== undefined || options.priceMax !== undefined) {
      const priceWhere: Record<string, number> = {}
      if (options.priceMin !== undefined) {
        priceWhere.gte = options.priceMin
      }
      if (options.priceMax !== undefined) {
        priceWhere.lte = options.priceMax
      }
      where.price = priceWhere
    }

    // Set default pagination values
    const limit = options.limit ?? ITEMS_PER_PAGE
    const offset = options.offset ?? 0

    // Get total count for pagination metadata
    const total = await db.product.count({ where })

    // Build orderBy based on sort parameter
    let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" }
    if (options.sort) {
      const sortField = options.sort as keyof typeof orderBy
      const sortOrder = options.order ?? "asc"
      // Validate sort field to prevent injection
      const validFields = ["name", "createdAt", "featured", "description", "price", "productType"]
      if (validFields.includes(options.sort)) {
        orderBy = { [sortField]: sortOrder }
      }
    }

    const products = await db.product.findMany({
      where,
      include: {
        productCollections: {
          include: {
            collection: true,
          },
        },
      },
      orderBy,
      take: limit,
      skip: offset,
    })

    return {
      products: applyMultiplierToProducts(products as ProductWithCollections[], priceMultiplier),
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
): Promise<ProductWithCollections[]> {
  const result = await getProducts({ featured: true, limit }, priceMultiplier)
  return result.products
}

/**
 * Get a product by slug with collections and inspirations
 * Used for product detail pages
 * Returns null if not found or if product is soft-deleted
 */
export async function getProductWithInspirations(
  slug: string,
  priceMultiplier = 1.0
): Promise<ProductWithInspirations | null> {
  return withTiming(
    "getProductWithInspirations",
    slug,
    async () => {
      const product = await db.product.findFirst({
        where: {
          slug,
          deletedAt: null, // Exclude soft-deleted products
        },
        include: {
          productCollections: {
            include: {
              collection: true,
            },
          },
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
        },
      })

      if (!product) return null
      return applyMultiplierToProduct(product as ProductWithInspirations, priceMultiplier)
    },
    { logNotFound: true }
  )
}

/**
 * Get available filter options for the shop page
 * Returns color IDs and collections - hex values are computed via COLORS map in components
 * Excludes soft-deleted products
 */
export async function getShopFilterOptions(): Promise<{
  colorIds: string[]
  collections: Array<{ id: string; name: string }>
}> {
  return withTiming("getShopFilterOptions", {}, async () => {
    // Get all unique color IDs from active (non-deleted) products
    const products = await db.product.findMany({
      where: { deletedAt: null },
      select: { colors: true },
    })
    const colorIdsSet = new Set<string>()
    products.forEach((product) => {
      product.colors.forEach((colorId) => {
        colorIdsSet.add(colorId)
      })
    })
    const colorIds = Array.from(colorIdsSet).sort()

    // Get all collections
    const collections = await db.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { colorIds, collections }
  })
}
