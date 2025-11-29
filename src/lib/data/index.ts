/**
 * Data Access Layer
 * Centralized data fetching with automatic price multiplier application
 *
 * Usage:
 * import { getProductBySlug, getCollectionBySlug } from "@/lib/data"
 *
 * Logging:
 * - All operations log timing information by default
 * - Set DAL_LOG_LEVEL=debug for more verbose output
 * - Set DAL_LOG_LEVEL=warn to reduce output
 */

// Collections
export {
  type CollectionBasic,
  type CollectionWithProducts,
  getAllCollectionSlugs,
  getAllCollections,
  getCollectionById,
  getCollectionBySlug,
} from "./collections"
// Inspirations
export {
  getAllInspirationSlugs,
  getAllInspirations,
  getInspirationById,
  getInspirationBySlug,
  getInspirationsWithCounts,
  type InspirationBasic,
  type InspirationWithProducts,
} from "./inspirations"
// Logger utilities (for custom usage)
export { logDataAccess, logError, logNotFound, withTiming } from "./logger"
// Products
export {
  type GetProductsOptions,
  getAllProductSlugs,
  getFeaturedProducts,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductWithInspirations,
  type ProductWithInspirations,
  type ProductWithVariants,
  type ProductWithVariantsAndCollection,
} from "./products"
