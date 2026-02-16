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

import type { CartItemData } from "@/components/site/CartItem"
import type { Role } from "@/generated/enums"
import type {
  AddressGetPayload,
  CollectionGetPayload,
  InspirationGetPayload,
  MetricGetPayload,
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
type UserFull = UserGetPayload<{
  select: {
    id: true
    email: true
    emailVerified: true
    name: true
    image: true
    role: true
    approved: true
    priceMultiplier: true
    createdAt: true
    updatedAt: true
  }
}>

/**
 * UserForAdmin: User data safe for admin display (excludes email verification state)
 * Use when: Admin listings, user management tables
 */
export type UserForAdmin = Omit<UserFull, "emailVerified" | "image" | "updatedAt">

/**
 * UserForProfile: User data safe for public/profile display
 * Use when: User profile pages, session data that appears in UI
 */
type UserForProfile = Omit<UserFull, "emailVerified" | "priceMultiplier" | "updatedAt">

/**
 * SessionUser: Minimal user data derived from Prisma User for session storage
 * Required fields: id, email, approved, role, priceMultiplier (for auth & cart operations)
 * Optional fields: name, image (user profile data)
 *
 * Use when: Session storage, server actions, permission checks, component props
 * Note: This type is automatically synced with User schema via Prisma's type generation
 */
export type SessionUser = Pick<UserFull, "id" | "email" | "approved" | "priceMultiplier"> & {
  role: Role
} & Partial<Pick<UserFull, "name" | "image" | "createdAt">>

// =============================================================================
// PRODUCT TYPES
// =============================================================================

/**
 * ProductFull: Product with all related data
 * Use when: Product detail pages, admin product management, inventory operations
 */
type ProductFull = ProductGetPayload<{
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
export type ProductWithCollections = ProductFull

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
    attachments: true
  }
}>

/**
 * CartWithItems: Order in "CART" status with items and product details
 * Use when: Shopping cart view, cart modification, cart totals calculation
 * NOTE: This is an Order filtered by status: "CART"; type represents structure only
 */
export type CartWithItems = OrderWithItems

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
 * AdminOrderItem: alias used by admin UI components for order item rows.
 * Kept as an explicit export to make UI props self-documenting.
 */
export type AdminOrderItem = OrderItemWithProduct

/**
 * OrderItemWithOrder: Single order item with parent order reference
 * Use when: Item-level operations that need order context
 */
export type OrderItemWithOrder = OrderItemGetPayload<{
  include: {
    order: true
  }
}>

/**
 * OrdersWithCount: Orders with user, delivery address, items with product prices, and item count
 * Use when: Admin order listings, order tables with pagination metadata
 */
export type OrdersWithCount = OrderGetPayload<{
  include: {
    user: { select: { id: true; email: true; name: true } }
    deliveryAddress: { select: { email: true } }
    items: { include: { product: { select: { price: true } } } }
    _count: { select: { items: true } }
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
 * CollectionBasic: Collection with product count
 * Use when: Collection listings, admin tables, collection cards
 */
export type CollectionBasic = CollectionGetPayload<{
  include: {
    _count: {
      select: {
        productCollections: true
      }
    }
  }
}>

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
export type InspirationBasic = InspirationGetPayload<{
  include: {
    _count: {
      select: {
        products: true
      }
    }
  }
}>

/**
 * InspirationForResponse: Core inspiration fields for API/action responses
 * Use when: Returning inspiration from create/update operations without product relations
 */
export type InspirationForResponse = Omit<InspirationGetPayload<true>, "products">

// =============================================================================
// ERROR HANDLING TYPES
// =============================================================================

/**
 * AppError: Standard error response from server actions
 * Use discriminated union pattern: check 'success' field to narrow type in error handlers
 */
export type AppError = {
  success: false
  error: string
  code?:
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "INVALID_INPUT"
    | "CONFLICT"
    | "SERVER_ERROR"
    | "VALIDATION_ERROR"
  details?: Record<string, string | string[]>
}

/**
 * AppResult: Discriminated union for type-safe server action responses
 * All server actions should return AppResult<T> or a specific success type
 * Enables exhaustive type checking: result.success ? result.data : result.error
 */
export type AppResult<T> = { success: true; data: T } | AppError

// =============================================================================
// RESPONSE TYPES FOR SERVER ACTIONS
// ============================================================================="

/**
 * CartResponse: Structured response for cart operations
 * Includes the cart with adjusted items and calculated total
 * Used by cart action functions to return consistent cart data
 */
export type CartResponse = Pick<
  OrderGetPayload<true>,
  "id" | "orderNumber" | "status" | "notes"
> & {
  items: CartItemData[]
  total: number
}

// =============================================================================
// METRICS TYPES
// =============================================================================

/**
 * Metric: Individual metric record
 * Use when: Tracking performance metrics, recording query durations
 */
export type Metric = Omit<MetricGetPayload<true>, "id" | "createdAt">

// =============================================================================
// SEARCH & RESPONSE TYPES FOR SERVER ACTIONS
// =============================================================================

/**
 * SearchProductsResult: Search results containing product summaries
 * Use when: Returning search results from searchProducts action
 */
export type SearchProductsResult = {
  products: Array<Pick<ProductBasic, "id" | "name" | "slug" | "price">>
}

/**
 * CancelOrderResponse: Data returned on successful order cancellation
 * Use when: Canceling orders with optional cart conversion
 */
export type CancelOrderResponse = OrderWithItems

/**
 * UserProfileResponse: User profile data returned from profile operations
 * Use when: Updating or fetching user profile information
 */
export type UserProfileResponse = UserForProfile

/**
 * AdminUserResponse: User data for admin operations
 * Use when: Admin user management (approve, unapprove, update multiplier)
 */
export type AdminUserResponse = UserForAdmin
