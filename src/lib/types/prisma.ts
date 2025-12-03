/**
 * Prisma Type Utilities
 * Centralized type definitions for Prisma queries with relations
 *
 * These types use Prisma's GetPayload pattern to derive types from query includes,
 * ensuring they stay in sync with the database schema automatically.
 */

import type { Prisma } from "@/generated/client"

// Re-export base model types for convenience
export type {
  CollectionModel,
  InspirationModel,
  InspirationProductModel,
  ProductModel,
  ProductVariantModel,
} from "@/generated/models"

// =============================================================================
// Product Types
// =============================================================================

/** Product with its variants included */
export type ProductWithVariants = Prisma.ProductGetPayload<{
  include: { variants: true }
}>

/** Product with variants and collections included */
export type ProductWithVariantsAndCollection = Prisma.ProductGetPayload<{
  include: {
    variants: true
    productCollections: {
      include: {
        collection: true
      }
    }
  }
}>

/** Product with variants, collections, and inspirations with counts */
export type ProductWithInspirations = Prisma.ProductGetPayload<{
  include: {
    variants: true
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

// =============================================================================
// Collection Types
// =============================================================================

/** Basic collection without relations */
export type CollectionBasic = Prisma.CollectionGetPayload<Record<string, never>>

/** Basic collection including product count (_count.productCollections) */
export type CollectionBasicWithCount = Prisma.CollectionGetPayload<{
  include: { _count: { select: { productCollections: true } } }
}>

/** Collection with all products and their variants */
export type CollectionWithProducts = Prisma.CollectionGetPayload<{
  include: {
    productCollections: {
      include: {
        product: {
          include: {
            variants: true
          }
        }
      }
    }
  }
}>

// =============================================================================
// Inspiration Types
// =============================================================================

/** Inspiration with product count */
export type InspirationWithCount = Prisma.InspirationGetPayload<{
  include: {
    _count: {
      select: { products: true }
    }
  }
}>

/** Inspiration with full product details including variants */
export type InspirationWithProducts = Prisma.InspirationGetPayload<{
  include: {
    products: {
      include: {
        product: {
          include: { variants: true }
        }
        productVariant: true
      }
    }
  }
}>

// =============================================================================
// Query Input Types (re-exported for convenience)
// =============================================================================

export type { CollectionWhereInput } from "@/generated/models/Collection"
export type { InspirationWhereInput } from "@/generated/models/Inspiration"
export type { ProductWhereInput } from "@/generated/models/Product"
export type { ProductVariantWhereInput } from "@/generated/models/ProductVariant"
