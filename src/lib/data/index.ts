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
  getAllCollectionSlugs,
  getAllCollections,
  getCollectionBySlug,
} from "./collections"
// Inspirations
export {
  getAllInspirationSlugs,
  getInspirationBySlug,
  getInspirationsWithCounts,
} from "./inspirations"
// Logger utilities (for custom usage)

// Products
export {
  getAllProductSlugs,
  getFeaturedProducts,
  getProductById,
  getProducts,
  getProductWithInspirations,
  getShopFilterOptions,
} from "./products"
