/**
 * Centralized Prisma Query Type Exports
 *
 * This file defines reusable type exports derived from Prisma's GetPayload helper.
 * Each export represents a common database query pattern used across the application.
 * These types serve as the single source of truth for DB return types, ensuring
 * type safety and consistency across server actions and data-fetching layers.
 *
 * Organization:
 * - User types (full, admin-safe, profile-safe)
 * - Product types (with collections, details)
 * - Order types (with items, snapshots, full detail)
 * - OrderItem types (with product, order)
 * - Cart types (orders with cart status)
 * - Address types
 * - Collection types
 */

import type {
  AddressGetPayload,
  CollectionGetPayload,
  InspirationGetPayload,
  OrderGetPayload,
  OrderItemGetPayload,
  ProductGetPayload,
  UserGetPayload,
} from "@/generated/models"

// =============================================================================
// USER TYPES
// =============================================================================

/**
 * UserFull: Complete user record with all fields
 * Use when: Internal operations, admin views that need all user data
 */
export type UserFull = UserGetPayload<{
  select: {
    id: true
    email: true
    emailVerified: true
    name: true
    image: true
    role: true
    approved: true
    priceMultiplier: true
    phone: true
    createdAt: true
    updatedAt: true
  }
}>

/**
 * UserForAdmin: User data safe for admin display (excludes email verification state)
 * Use when: Admin listings, user management tables
 */
export type UserForAdmin = UserGetPayload<{
  select: {
    id: true
    email: true
    name: true
    role: true
    approved: true
    priceMultiplier: true
    createdAt: true
  }
}>

/**
 * UserForProfile: User data safe for public/profile display
 * Use when: User profile pages, session data that appears in UI
 */
export type UserForProfile = UserGetPayload<{
  select: {
    id: true
    email: true
    name: true
    image: true
    role: true
    approved: true
    createdAt: true
  }
}>

/**
 * SessionUser: Minimal user data derived from UserForProfile for session storage
 * All fields optional since session is cached and may not have all data initially.
 * Includes priceMultiplier for cart calculations and permission checks.
 *
 * Use when: Session storage, component props, cached user data
 * Note: This type is automatically synced with User schema changes through UserForProfile
 */
export type SessionUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role?: string
  approved?: boolean
  priceMultiplier?: number
  createdAt?: Date
  emailVerified?: boolean
  updatedAt?: Date
}

/**
 * UserWithAddresses: User with their saved addresses
 * Use when: Checkout flow, address selection, user details with delivery info
 */
export type UserWithAddresses = UserGetPayload<{
  include: {
    addresses: true
  }
}>

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * ProductFull: Product with all related data
 * Use when: Product detail pages, admin product management, inventory operations
 */
export type ProductFull = ProductGetPayload<{
  include: {
    productCollections: {
      include: {
        collection: true
      }
    }
  }
}>

/**
 * ProductWithCollections: Product with collection associations
 * Use when: Product listings, category filtering, product cards
 */
export type ProductWithCollections = ProductGetPayload<{
  include: {
    productCollections: {
      include: {
        collection: true
      }
    }
  }
}>

/**
 * ProductBasic: Minimal product data (no relations)
 * Use when: Product snapshots in orders, lightweight product references
 */
export type ProductBasic = ProductGetPayload<true>

/**
 * ProductWithInspirations: Product with associated collections AND inspirations
 * Use when: Product detail pages showing related inspiration content
 */
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

// =============================================================================
// ORDER & CART TYPES
// =============================================================================

/**
 * OrderWithItems: Order with all line items and their product details
 * Use when: Order history, order lists, checkout flows where product images/names are needed
 */
export type OrderWithItems = OrderGetPayload<{
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
}>

/**
 * OrderWithItemsAndProducts: Full order with items and their product snapshots
 * Use when: Order detail pages, order confirmation, invoice generation
 */
export type OrderWithItemsAndProducts = OrderGetPayload<{
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
}>

/**
 * CartWithItems: Order in "CART" status with items and product details
 * Use when: Shopping cart view, cart modification, cart totals calculation
 * NOTE: This is an Order filtered by status: "CART"; type represents structure only
 */
export type CartWithItems = OrderGetPayload<{
  include: {
    items: {
      include: {
        product: true
      }
    }
  }
}>

/**
 * CartWithItemsAndUser: Full cart with items, products, AND user info
 * Use when: Cart page rendering, cart operations with user context
 */
export type CartWithItemsAndUser = OrderGetPayload<{
  include: {
    user: true
    items: {
      include: {
        product: true
      }
    }
  }
}>

/**
 * OrderItemWithProduct: Single order item with its product snapshot
 * Use when: Line item operations, cart item updates, order item details
 */
export type OrderItemWithProduct = OrderItemGetPayload<{
  include: {
    product: true
  }
}>

/**
 * OrderItemWithOrder: Single order item with parent order reference
 * Use when: Item-level operations that need order context
 */
export type OrderItemWithOrder = OrderItemGetPayload<{
  include: {
    order: true
  }
}>

// =============================================================================
// ADDRESS TYPES
// =============================================================================

/**
 * AddressFull: Complete address record with all fields
 * Use when: Delivery address selection, user address management
 */
export type AddressFull = AddressGetPayload<true>

// =============================================================================
// COLLECTION TYPES
// =============================================================================

/**
 * CollectionWithProducts: Collection with all associated products
 * Use when: Collection detail pages, collection browsing
 */
export type CollectionWithProducts = CollectionGetPayload<{
  include: {
    productCollections: {
      include: {
        product: true
      }
    }
  }
}>

/**
 * CollectionBasic: Minimal collection data (no product relations)
 * Use when: Collection references, collection lists, navigation
 */
export type CollectionBasic = CollectionGetPayload<true>

// =============================================================================
// INSPIRATION TYPES
// =============================================================================

/**
 * InspirationWithProducts: Inspiration page with associated products
 * Use when: Inspiration page display, inspiration detail view
 */
export type InspirationWithProducts = InspirationGetPayload<{
  include: {
    products: {
      include: {
        product: true
      }
    }
  }
}>

/**
 * InspirationBasic: Minimal inspiration data (no product relations)
 * Use when: Inspiration listings, navigation, thumbnails
 */
export type InspirationBasic = InspirationGetPayload<true>
