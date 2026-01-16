/**
 * Product Types - Re-exported from query-types.ts for backward compatibility
 *
 * This file serves as a re-export barrel for product-related types.
 * New types should be added to src/lib/query-types.ts and imported here.
 */

import type {
  ProductBasic,
  ProductFull,
  ProductWithCollections,
  ProductWithInspirations,
} from "@/lib/query-types"

// Re-exports from query-types.ts
export type { ProductFull, ProductWithCollections, ProductBasic, ProductWithInspirations }

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
