import { vi } from "vitest"
import { Role } from "@/generated/client"
import type {
  CartWithItems,
  OrderItemWithOrder,
  OrderItemWithProduct,
  ProductBasic,
  SessionUser,
} from "@/lib/query-types"

/**
 * Mock factory for common dependencies and test data
 * Use these in your tests to create properly-typed test objects
 */

// =============================================================================
// PRISMA CLIENT MOCKS
// =============================================================================

/**
 * Create a mocked Prisma client for server action tests
 * Example usage:
 *   const mockPrisma = createMockPrismaClient()
 *   vi.mocked(mockPrisma).user.findUnique.mockResolvedValueOnce(mockUserFull())
 */
export function createMockPrismaClient() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    collection: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    orderAttachment: {
      findUnique: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    orderItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    account: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    address: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    inspiration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    inspirationProduct: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    metric: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  }
}
// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

/**
 * Create a mock SessionUser object (minimal user for session storage)
 * Example: mockSessionUser({ role: "ADMIN", priceMultiplier: 1.5 })
 */
export function mockSessionUser(overrides?: Partial<SessionUser>): SessionUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    name: "Test User",
    image: null,
    role: Role.CUSTOMER,
    approved: false,
    priceMultiplier: 1.0,
    ...overrides,
  }
}

/**
 * Create a mock ProductBasic object
 * Example: mockProductBasic({ name: "Premium Rose", price: 75 })
 */
export function mockProductBasic(overrides?: Partial<ProductBasic>): ProductBasic {
  return {
    id: "test-product-id",
    name: "Test Product",
    slug: "test-product",
    images: ["/images/test-product.jpg"],
    price: 50.0,
    description: "A test product",
    colors: [],
    featured: false,
    productType: "ROSE" as const,
    deletedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-15"),
    ...overrides,
  }
}

/**
 * Create a mock OrderItemWithProduct object
 * Example: mockOrderItemWithProduct({ quantity: 2, product: mockProductBasic({ price: 100 }) })
 */
export function mockOrderItemWithProduct(
  overrides?: Partial<OrderItemWithProduct>
): OrderItemWithProduct {
  return {
    id: "test-order-item-id",
    orderId: "test-order-id",
    productId: "test-product-id",
    quantity: 1,
    price: 50.0,
    productNameSnapshot: "Test Product",
    productImageSnapshot: "/images/test-product.jpg",
    product: mockProductBasic(),
    ...overrides,
  }
}

/**
 * Create a mock CartWithItems object
 * Example: mockCartWithItems({ userId: "user-123", items: [mockOrderItemWithProduct({ quantity: 2 })] })
 */
export function mockCartWithItems(overrides?: Partial<CartWithItems>): CartWithItems {
  const cartId = overrides?.id || "test-order-id"
  return {
    id: cartId as string,
    friendlyId: overrides?.friendlyId ?? `test-user-id-${String(cartId).slice(-4)}`,
    userId: "test-user-id",
    status: "CART" as const,
    notes: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    deliveryAddressId: null,
    items: [
      mockOrderItemWithProduct({
        orderId: cartId as string,
      }),
    ],
    attachments: [],
    ...overrides,
  }
}

/**
 * Create a mock Order (without items for API responses)
 * Used for findFirst queries that don't include items
 */
export function mockOrder(overrides?: Record<string, unknown>) {
  return {
    id: "test-order-id",
    friendlyId: overrides?.friendlyId
      ? `test-user-id-${String("test-order-id").slice(-4)}`
      : "test-user-mock-order",
    userId: "test-user-id",
    status: "CART" as const,
    notes: null,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
    deliveryAddressId: null,
    attachments: [],
    ...overrides,
  }
}

/**
 * Create a mock OrderItem with Order relation
 * Used when orderItem needs parent order reference
 * Example: mockOrderItemWithOrder({ orderId: CART_ID, order: { userId: USER_ID } })
 */
export function mockOrderItemWithOrder(
  overrides?: Record<string, unknown> & { order?: Record<string, unknown> }
): OrderItemWithOrder {
  const orderId = (overrides?.orderId as string) || "test-order-id"
  const orderOverrides = overrides?.order || {}
  const userId = (orderOverrides.userId as string) || "test-user-id"

  const { order, ...itemOverrides } = overrides || {}

  return {
    ...mockOrderItemWithProduct({ orderId, ...itemOverrides }),
    order: mockOrder({ id: orderId, userId, ...orderOverrides }),
  } as OrderItemWithOrder
}
