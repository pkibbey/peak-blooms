/**
 * Data Layer Type Definitions
 * Centralized types for data access operations
 */

import type { ProductWithVariantsAndCollection } from "./prisma"

// =============================================================================
// Product Data Types
// =============================================================================

/**
 * Options for filtering and paginating products
 * Used by getProducts() and related data functions
 */
export interface GetProductsOptions {
  collectionIds?: string[]
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
  sort?: string
  order?: "asc" | "desc"
}

/**
 * Result from getProducts() containing paginated products and metadata
 */
export interface GetProductsResult {
  products: ProductWithVariantsAndCollection[]
  total: number
  limit: number
  offset: number
}
