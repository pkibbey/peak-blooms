import { beforeEach, describe, expect, it, vi } from "vitest"
import { type OrderStatus, Role } from "@/generated/enums"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/lib/utils", () => ({
  adjustPrice: vi.fn((price, multiplier) => {
    return Math.round(price * multiplier * 100) / 100
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/generated/enums", () => ({
  OrderStatus: {
    CART: "CART",
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
  },
  Role: {
    ADMIN: "ADMIN",
    CUSTOMER: "CUSTOMER",
  },
}))

// Mock PDF generator + Vercel Blob client used by generateInvoiceAction
vi.mock("@/app/actions/pdf", () => ({
  generateInvoicePdfBuffer: vi.fn(async () => Buffer.from("PDF")),
}))
vi.mock("@vercel/blob/client", () => ({
  generateClientTokenFromReadWriteToken: vi.fn(async () => "token"),
  put: vi.fn(async () => ({
    url: "https://blob.vercel-storage.com/generated/invoices/invoice.pdf",
  })),
}))

import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import {
  cancelOrderAction,
  createOrderAction,
  deleteOrderAction,
  deleteOrderItemAction,
  generateInvoiceAction,
  updateOrderItemPriceAction,
  updateOrderStatusAction,
} from "./orders"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440001"
const VALID_UUID_2 = "550e8400-e29b-41d4-a716-446655440002"
const VALID_UUID_3 = "550e8400-e29b-41d4-a716-446655440003"

// Mock Factory Defaults with full Prisma model properties
const createMockDefaults = (baseDate = new Date()) => ({
  user: (overrides = {}) => ({
    id: "user-1",
    email: "test@example.com",
    emailVerified: false,
    name: "Test User",
    image: null,
    approved: true,
    role: Role.CUSTOMER,
    priceMultiplier: 1.0,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }),

  adminUser: (overrides = {}) => ({
    id: "admin-1",
    email: "admin@example.com",
    emailVerified: false,
    name: "Admin User",
    image: null,
    approved: true,
    role: Role.ADMIN,
    priceMultiplier: 1.0,
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }),

  order: (overrides = {}) => ({
    id: VALID_UUID,
    userId: "user-1",
    orderNumber: "1",
    status: "PENDING" as OrderStatus,
    notes: null,
    deliveryAddressId: VALID_UUID_2,
    createdAt: baseDate,
    updatedAt: baseDate,
    items: [],
    ...overrides,
  }),

  orderItem: (overrides = {}) => ({
    id: VALID_UUID_3,
    orderId: VALID_UUID,
    productId: VALID_UUID_2,
    quantity: 1,
    price: 50,
    productNameSnapshot: null,
    productImageSnapshot: null,
    ...overrides,
  }),

  address: (overrides = {}) => ({
    id: VALID_UUID_2,
    userId: "user-1",
    firstName: "John",
    lastName: "Doe",
    company: "Company",
    street1: "123 Main St",
    street2: null,
    city: "Boston",
    state: "MA",
    zip: "02101",
    country: "US",
    email: "john@example.com",
    phone: "+12065550100",
    isDefault: false,
    createdAt: baseDate,
    ...overrides,
  }),
})

describe("Order Actions", () => {
  const baseDate = new Date()
  const mockDefaults = createMockDefaults(baseDate)
  const mockUser = mockDefaults.user()
  const mockAdminUser = mockDefaults.adminUser()
  const mockOrder = mockDefaults.order()

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
  })

  describe("cancelOrderAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      const result = await cancelOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return validation error for missing/invalid order id", async () => {
      const result = await cancelOrderAction({ orderId: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should return error if order is not PENDING", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(
        mockDefaults.order({ status: "CONFIRMED" as OrderStatus })
      )
      const result = await cancelOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CONFLICT")
      }
    })

    it("should cancel PENDING order successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "CANCELLED" as OrderStatus })
      )
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())

      const result = await cancelOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("CANCELLED")
      }
    })

    it("should convert to cart successfully and clear snapshots", async () => {
      const orderWithItems = mockDefaults.order({
        items: [mockDefaults.orderItem({ id: "item-1", productNameSnapshot: "Roses" })],
      })
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(orderWithItems)
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({
          items: orderWithItems.items,
          status: "CART" as OrderStatus,
        })
      )

      const result = await cancelOrderAction({ orderId: VALID_UUID, convertToCart: true })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("CART")
      }
      expect(db.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { productNameSnapshot: null, productImageSnapshot: null },
        })
      )
    })

    it("should handle generic exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("String error")
      const result = await cancelOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("String error")
      }
    })
  })

  describe("updateOrderStatusAction", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should return error if not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const result = await updateOrderStatusAction({ orderId: VALID_UUID, status: "CONFIRMED" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if order not found", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(null)
      const result = await updateOrderStatusAction({ orderId: VALID_UUID, status: "CONFIRMED" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should update status successfully", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "CONFIRMED" as OrderStatus })
      )
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ status: "CONFIRMED" as OrderStatus })
      )

      const result = await updateOrderStatusAction({ orderId: VALID_UUID, status: "CONFIRMED" })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("CONFIRMED")
      }
    })

    it("should return validation error for missing/invalid order id", async () => {
      const result = await updateOrderStatusAction({ orderId: "", status: "CONFIRMED" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })
  })

  describe("updateOrderItemPriceAction", () => {
    const mockItem = mockDefaults.orderItem()

    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should update price and recalculate total including market prices", async () => {
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem)
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(mockDefaults.orderItem({ price: 50 }))
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([
        mockDefaults.orderItem({ quantity: 2, price: 50 }),
        mockDefaults.orderItem({ id: "item-2", price: 0, quantity: 1 }),
      ])

      const result = await updateOrderItemPriceAction({
        orderId: VALID_UUID,
        itemId: VALID_UUID_3,
        price: 50,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.orderTotal).toBe(100)
      }
    })

    it("should return validation error for missing/invalid order id in updateOrderItemPriceAction", async () => {
      const result = await updateOrderItemPriceAction({
        orderId: "",
        itemId: VALID_UUID_3,
        price: 50,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should return error when order item not found", async () => {
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)

      const result = await updateOrderItemPriceAction({
        orderId: VALID_UUID,
        itemId: VALID_UUID_3,
        price: 50,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })
  })

  describe("deleteOrderItemAction", () => {
    const mockItem = {
      id: VALID_UUID_3,
      orderId: VALID_UUID,
      productId: VALID_UUID_2,
      quantity: 1,
      price: 50,
    }

    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should return error if not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const result = await deleteOrderItemAction({ orderId: VALID_UUID, itemId: VALID_UUID_3 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return validation error for missing/invalid order id", async () => {
      const result = await deleteOrderItemAction({ orderId: "", itemId: VALID_UUID_3 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should return error when order item not found", async () => {
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null as never)
      const result = await deleteOrderItemAction({ orderId: VALID_UUID, itemId: VALID_UUID_3 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should delete item and return recalculated total", async () => {
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce({
        id: VALID_UUID,
        status: "CART",
      } as never)
      vi.mocked(db.orderItem.delete).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([
        { id: "remaining", price: 100, quantity: 1 },
      ] as never)

      const result = await deleteOrderItemAction({ orderId: VALID_UUID, itemId: VALID_UUID_3 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.orderTotal).toBe(100)
      }
    })
  })

  describe("deleteOrderAction", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should return error if not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const result = await deleteOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return validation error for missing/invalid order id", async () => {
      const result = await deleteOrderAction({ orderId: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should return error if order not found", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(null)
      const result = await deleteOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should allow deleting orders regardless of status when no invoices", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )
      vi.mocked(db.orderAttachment.findMany).mockResolvedValueOnce([])
      vi.mocked(db.order.delete).mockResolvedValueOnce(mockDefaults.order())

      const result = await deleteOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe(VALID_UUID)
      }
    })

    it("should prevent delete when there are invoice attachments", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(
        mockDefaults.order({ status: "CART" as OrderStatus })
      )
      vi.mocked(db.orderAttachment.findMany).mockResolvedValueOnce([
        {
          id: "att-1",
          orderId: VALID_UUID,
          url: "https://example.com/invoice.pdf",
          key: null,
          mime: "application/pdf",
          size: 1024,
          createdAt: baseDate,
        },
      ])

      const result = await deleteOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CONFLICT")
        expect(result.error).toContain("invoices")
      }
    })

    it("should delete order successfully when status is CART and no invoices", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(
        mockDefaults.order({ status: "CART" as OrderStatus })
      )
      vi.mocked(db.orderAttachment.findMany).mockResolvedValueOnce([])
      vi.mocked(db.order.delete).mockResolvedValueOnce(mockDefaults.order())
      const result = await deleteOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe(VALID_UUID)
      }
    })
  })

  describe("generateInvoiceAction", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should prevent invoice generation when order contains market-priced items", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(
        mockDefaults.order({
          items: [mockDefaults.orderItem({ id: "i1", price: 0, quantity: 1 })],
        })
      )

      const result = await generateInvoiceAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CONFLICT")
        expect(result.error).toContain("market-priced")
      }
    })

    it("should generate invoice when all items have prices", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(
        mockDefaults.order({
          user: mockUser,
          deliveryAddress: mockDefaults.address(),
          items: [mockDefaults.orderItem({ id: "i1", price: 10, quantity: 1 })],
        })
      )

      vi.mocked(db.orderAttachment.create).mockResolvedValueOnce({
        id: "att-1",
        orderId: VALID_UUID,
        url: "https://blob.vercel-storage.com/generated/invoices/invoice.pdf",
        key: null,
        mime: "application/pdf",
        size: null,
        createdAt: baseDate,
      })

      const result = await generateInvoiceAction({ orderId: VALID_UUID })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe("att-1")
      }
    })
  })

  describe("adminAddOrderItemsAction", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should require admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const result = await (await import("./orders")).adminAddOrderItemsAction({
        orderId: VALID_UUID,
        items: [{ productId: VALID_UUID_2, quantity: 1 }],
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("UNAUTHORIZED")
    })

    it("should validate input", async () => {
      const result = await (await import("./orders")).adminAddOrderItemsAction({
        orderId: "",
        items: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("VALIDATION_ERROR")
    })

    it("should error when order not found", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(null as never)
      const result = await (await import("./orders")).adminAddOrderItemsAction({
        orderId: VALID_UUID,
        items: [{ productId: VALID_UUID_2, quantity: 1 }],
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NOT_FOUND")
    })

    it("should create new order item when none exists", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockDefaults.order())
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockDefaults.user())
      vi.mocked(db.product.findUnique).mockResolvedValueOnce({
        id: VALID_UUID_2,
        price: 20,
        name: "Roses",
        images: ["img.jpg"],
        description: "Beautiful roses",
        createdAt: baseDate,
        updatedAt: baseDate,
        deletedAt: null,
        slug: "roses",
        colors: [],
        featured: false,
        productType: "FLOWER",
      })
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.orderItem.create).mockResolvedValueOnce(
        mockDefaults.orderItem({ id: "new-item", quantity: 3, price: 20 })
      )
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({
          items: [
            mockDefaults.orderItem({
              id: "new-item",
              quantity: 3,
              price: 20,
              product: { id: VALID_UUID_2, name: "Roses" },
            }),
          ],
          attachments: [],
        })
      )

      const result = await (await import("./orders")).adminAddOrderItemsAction({
        orderId: VALID_UUID,
        items: [{ productId: VALID_UUID_2, quantity: 3 }],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.items?.length).toBe(1)
        expect(result.data?.items?.[0].quantity).toBe(3)
      }
    })

    it("should increment existing item quantity", async () => {
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockDefaults.order())
      vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockDefaults.user())
      vi.mocked(db.product.findUnique).mockResolvedValueOnce({
        id: VALID_UUID_2,
        price: 10,
        name: "Roses",
        images: [],
        description: "Roses for arrangements",
        createdAt: baseDate,
        updatedAt: baseDate,
        deletedAt: null,
        slug: "roses",
        colors: [],
        featured: false,
        productType: "FLOWER",
      })
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(
        mockDefaults.orderItem({ id: "existing", quantity: 2 })
      )
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(
        mockDefaults.orderItem({ id: "existing", quantity: 5 })
      )
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({
          items: [
            mockDefaults.orderItem({
              id: "existing",
              quantity: 5,
              price: 10,
              product: { id: VALID_UUID_2, name: "Roses" },
            }),
          ],
          attachments: [],
        })
      )

      const result = await (await import("./orders")).adminAddOrderItemsAction({
        orderId: VALID_UUID,
        items: [{ productId: VALID_UUID_2, quantity: 3 }],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.items?.[0].quantity).toBe(5)
      }
    })
  })

  describe("adminUpdateOrderItemQuantityAction", () => {
    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should require admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const result = await (await import("./orders")).adminUpdateOrderItemQuantityAction({
        orderId: VALID_UUID,
        itemId: VALID_UUID_3,
        quantity: 2,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("UNAUTHORIZED")
    })

    it("should validate input", async () => {
      const result = await (await import("./orders")).adminUpdateOrderItemQuantityAction({
        orderId: "",
        itemId: "",
        quantity: -1,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("VALIDATION_ERROR")
    })

    it("should return not found when item missing", async () => {
      vi.mocked(db.orderItem.findUnique).mockResolvedValueOnce(null)
      const result = await (await import("./orders")).adminUpdateOrderItemQuantityAction({
        orderId: VALID_UUID,
        itemId: VALID_UUID_3,
        quantity: 2,
      })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.code).toBe("NOT_FOUND")
    })

    it("should update quantity successfully", async () => {
      vi.mocked(db.orderItem.findUnique).mockResolvedValueOnce(
        mockDefaults.orderItem({ quantity: 1 })
      )
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(mockDefaults.orderItem({ quantity: 4 }))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({
          items: [
            mockDefaults.orderItem({
              quantity: 4,
              product: { id: VALID_UUID_2, name: "Roses" },
            }),
          ],
          attachments: [],
        })
      )

      const result = await (await import("./orders")).adminUpdateOrderItemQuantityAction({
        orderId: VALID_UUID,
        itemId: VALID_UUID_3,
        quantity: 4,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data?.items?.[0].quantity).toBe(4)
    })

    it("should delete item when quantity is 0", async () => {
      vi.mocked(db.orderItem.findUnique).mockResolvedValueOnce(
        mockDefaults.orderItem({ quantity: 1 })
      )
      vi.mocked(db.orderItem.delete).mockResolvedValueOnce(mockDefaults.orderItem())
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ items: [], attachments: [] })
      )

      const result = await (await import("./orders")).adminUpdateOrderItemQuantityAction({
        orderId: VALID_UUID,
        itemId: VALID_UUID_3,
        quantity: 0,
      })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data?.items?.length).toBe(0)
    })
  })

  describe("createOrderAction", () => {
    const validData = {
      deliveryAddressId: VALID_UUID_2,
      deliveryAddress: null,
      saveDeliveryAddress: false,
      notes: "Test note",
    }

    const mockCart = mockDefaults.order({
      id: "cart-1",
      status: "CART" as OrderStatus,
      items: [
        mockDefaults.orderItem({
          id: VALID_UUID_3,
          product: {
            id: VALID_UUID_2,
            name: "Roses",
            sku: "ROSE-001",
            description: "Beautiful roses",
            price: 150,
            images: ["roses.jpg"],
            type: "CUT_FLOWER",
            collectionId: null,
            isArchived: false,
            createdAt: baseDate,
            updatedAt: baseDate,
          },
          quantity: 2,
        }),
      ],
    })

    it("should return error if user not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      const result = await createOrderAction(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN")
      }
    })

    it("should return error if cart empty", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)
      const result = await createOrderAction(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CONFLICT")
      }
    })

    it("should return error if existing address not found", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(null)
      const result = await createOrderAction(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should create order with existing address", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart)
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(mockDefaults.address())
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )

      const result = await createOrderAction(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("PENDING")
      }
    })

    it("should include notes if provided", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart)
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(mockDefaults.address())
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus, notes: "Test note" })
      )

      await createOrderAction({ ...validData, notes: "Test note" })
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: "Test note" }),
        })
      )
    })

    it("should handle market items and multiplier in createOrderAction", async () => {
      const marketCart = mockDefaults.order({
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          mockDefaults.orderItem({
            id: VALID_UUID_3,
            product: {
              id: VALID_UUID_2,
              name: "Roses",
              price: 0,
              sku: "ROSE-001",
              description: "Market priced roses",
              images: ["roses.jpg"],
              type: "CUT_FLOWER",
              collectionId: null,
              isArchived: false,
              createdAt: baseDate,
              updatedAt: baseDate,
            },
            quantity: 2,
          }),
          mockDefaults.orderItem({
            id: "item-2",
            productId: VALID_UUID_3,
            product: {
              id: VALID_UUID_3,
              name: "Tulips",
              price: 100,
              sku: "TULIP-001",
              description: "Premium tulips",
              images: [],
              type: "CUT_FLOWER",
              collectionId: null,
              isArchived: false,
              createdAt: baseDate,
              updatedAt: baseDate,
            },
            quantity: 1,
          }),
        ],
      })
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockDefaults.user({ priceMultiplier: 1.5 }))
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(marketCart)
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(mockDefaults.address())
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )

      await createOrderAction(validData)
      expect(db.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: 150 }),
        })
      )
    })

    it("should create order with new address", async () => {
      const newAddr = mockDefaults.address({
        firstName: "A",
        lastName: "B",
        company: "Company",
        street1: "S",
        street2: "",
        city: "C",
        state: "S",
        zip: "12345",
        phone: "+12065550100",
        email: "a@b.com",
        country: "US",
      })
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart)
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())
      vi.mocked(db.address.create).mockResolvedValueOnce(newAddr)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )

      const result = await createOrderAction({
        ...validData,
        deliveryAddressId: null,
        deliveryAddress: {
          firstName: "A",
          lastName: "B",
          company: "Company",
          street1: "S",
          street2: "",
          city: "C",
          state: "S",
          zip: "12345",
          phone: "+12065550100",
          email: "a@b.com",
          country: "US",
        },
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("PENDING")
      }
      expect(db.address.create).toHaveBeenCalled()
    })

    it("should save new address to user if saveDeliveryAddress is true", async () => {
      const newAddr = mockDefaults.address({
        firstName: "A",
        lastName: "B",
        company: "Company",
        street1: "S",
        street2: "",
        city: "C",
        state: "S",
        zip: "12345",
        phone: "+12065550100",
        email: "a@b.com",
        country: "US",
      })
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart)
      vi.mocked(db.orderItem.update).mockResolvedValue(mockDefaults.orderItem())
      vi.mocked(db.address.create).mockResolvedValueOnce(newAddr)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )
      vi.mocked(db.order.update).mockResolvedValueOnce(
        mockDefaults.order({ status: "PENDING" as OrderStatus })
      )

      await createOrderAction({
        ...validData,
        deliveryAddressId: null,
        deliveryAddress: {
          firstName: "A",
          lastName: "B",
          company: "Company",
          street1: "S",
          street2: "",
          city: "C",
          state: "S",
          zip: "12345",
          phone: "+12065550100",
          email: "a@b.com",
          country: "US",
        },
        saveDeliveryAddress: true,
      })
      expect(db.address.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: mockUser.id }),
        })
      )
    })

    it("should handle Error object in createOrderAction catch block", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce(new Error("Specific Error"))
      const result = await createOrderAction(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Specific Error")
      }
    })

    it("should handle generic exception in createOrderAction", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Error")
      const result = await createOrderAction(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Error")
      }
    })
  })
})
