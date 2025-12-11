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
  AddressModel,
  CartItemModel,
  CollectionModel,
  InspirationModel,
  InspirationProductModel,
  OrderItemModel,
  OrderModel,
  ProductModel,
  ShoppingCartModel,
  UserModel,
} from "@/generated/models"

// =============================================================================
// User Types
// =============================================================================

/** Minimal user data for cart operations (from getCurrentUser) */
export interface CartUser {
  id: string
  priceMultiplier: number
  email?: string
  name?: string
  role?: string
  approved?: boolean
}

/** User with minimal fields */
export type UserBasic = Prisma.UserGetPayload<Record<string, never>>

/** User with complete address information */
export type UserWithAddresses = Prisma.UserGetPayload<{
  include: { addresses: true }
}>

/** User with cart and cart items */
export type UserWithCart = Prisma.UserGetPayload<{
  include: {
    cart: {
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    }
  }
}>

// =============================================================================
// Product Types
// =============================================================================

/** Product with collections included */
export type ProductWithVariantsAndCollection = Prisma.ProductGetPayload<{
  include: {
    productCollections: {
      include: {
        collection: true
      }
    }
  }
}>

/** Product with collections and inspirations with counts */
export type ProductWithInspirations = Prisma.ProductGetPayload<{
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

// =============================================================================
// Collection Types
// =============================================================================

/** Basic collection without relations */
export type CollectionBasic = Prisma.CollectionGetPayload<Record<string, never>>

/** Basic collection including product count (_count.productCollections) */
export type CollectionBasicWithCount = Prisma.CollectionGetPayload<{
  include: { _count: { select: { productCollections: true } } }
}>

/** Collection with all products */
export type CollectionWithProducts = Prisma.CollectionGetPayload<{
  include: {
    productCollections: {
      include: {
        product: true
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

/** Inspiration with full product details */
export type InspirationWithProducts = Prisma.InspirationGetPayload<{
  include: {
    products: {
      include: {
        product: true
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
