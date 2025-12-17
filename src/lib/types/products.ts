import type { ProductGetPayload } from "@/generated/models"

/**
 * Options for filtering and paginating products
 * Used by getProducts() and related data functions
 */
export interface GetProductsOptions {
  collectionIds?: string[]
  featured?: boolean
  colors?: string[]
  priceMin?: number
  priceMax?: number
  search?: string
  limit?: number
  offset?: number
  sort?: string
  order?: "asc" | "desc"
}

/**
 * Result from getProducts() containing paginated products and metadata
 */
export interface GetProductsResult {
  products: ProductWithCollections[]
  total: number
  limit: number
  offset: number
}

export type ProductWithCollections = ProductGetPayload<{
  include: { productCollections: { include: { collection: true } } }
}>

/** Product with collections and inspirations with counts */
export type ProductWithInspirations = ProductGetPayload<{
  include: {
    productCollections: {
      include: {
        collection: true
      }
    }
    inspirations: {
      include: {
        inspiration: {
          include: {
            _count: {
              select: { products: true }
            }
          }
        }
      }
    }
  }
}>
