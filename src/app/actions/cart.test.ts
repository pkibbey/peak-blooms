import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createMockPrismaClient,
  mockCartWithItems,
  mockOrder,
  mockOrderItemWithOrder,
  mockOrderItemWithProduct,
  mockProductBasic,
  mockSessionUser,
} from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/lib/cart-utils", () => ({
  calculateCartTotal: vi.fn((items: CartItemForTotal[]) => items.length * 10),
  applyPriceMultiplierToItems: vi.fn((items: CartItemForTotal[], multiplier: number) =>
    items.map((item) => ({
      ...item,
      product: item.product
        ? { ...item.product, price: (item.product.price ?? 0) * (multiplier || 1.0) }
        : null,
    }))
  ),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import type { CartItemForTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import {
  addToCartAction,
  batchAddToCartAction,
  clearCartAction,
  getCartAction,
  removeFromCartAction,
  updateCartItemAction,
} from "./cart"

describe("Cart Actions", () => {
  const USER_ID = "550e8400-e29b-41d4-a716-446655440001"
  const PRODUCT_ID_1 = "550e8400-e29b-41d4-a716-446655440002"
  const PRODUCT_ID_2 = "550e8400-e29b-41d4-a716-446655440003"
  const CART_ID = "550e8400-e29b-41d4-a716-446655440004"
  const ITEM_ID_1 = "550e8400-e29b-41d4-a716-446655440005"

  const mockUser = mockSessionUser({
    id: USER_ID,
    email: "test@example.com",
    approved: true,
    priceMultiplier: 1,
  })

  const mockProduct = mockProductBasic({
    id: PRODUCT_ID_1,
    name: "Product 1",
    price: 10,
  })

  const mockCart = mockOrder({
    id: CART_ID,
    userId: USER_ID,
    status: "CART",
  })

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(db.$transaction).mockImplementation(
      (fn: (client: typeof db) => unknown) => fn(db) as never
    )
    vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as never)
  })

  describe("addToCartAction", () => {
    it("should add to cart successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(CART_ID)
      }
    })

    it("should update quantity if item already exists", async () => {
      const existingItem = mockOrderItemWithProduct({
        id: ITEM_ID_1,
        orderId: CART_ID,
        productId: PRODUCT_ID_1,
        quantity: 1,
      })
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(existingItem)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 5 })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(CART_ID)
      }
      expect(db.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: ITEM_ID_1 },
          data: { quantity: existingItem.quantity + 5 },
        })
      )
    })

    it("should handle createCart and default multiplier", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.order.create).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(true)
      expect(db.order.create).toHaveBeenCalled()
    })

    it("should return error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN")
      }
    })

    it("should return error if product not found in DB", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.product.findUnique).mockResolvedValue(null as never)
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should return error on createCart failure", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.order.create).mockResolvedValue(null as never)
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should return validation error for productId", async () => {
      const result = await addToCartAction({ productId: "not-a-uuid", quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should return validation error for quantity", async () => {
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 0 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should handle generic ZodError", async () => {
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: "bad" as never })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should handle generic Error in addToCartAction catch block", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce(new Error("Custom DB Error"))
      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })
  })

  describe("updateCartItemAction", () => {
    it("should update quantity successfully", async () => {
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: USER_ID },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 5 })
      expect(result.success).toBe(true)
      expect(db.orderItem.update).toHaveBeenCalled()
    })

    it("should use default multiplier in updateCartItemAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: USER_ID },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 5 })
      expect(result.success).toBe(true)
      expect(db.order.findUniqueOrThrow).toHaveBeenCalled()
    })

    it("should delete item if quantity is 0", async () => {
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: USER_ID },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 0 })
      expect(result.success).toBe(true)
      expect(db.orderItem.delete).toHaveBeenCalled()
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should throw error if not owner", async () => {
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: "other-user" },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN")
      }
    })

    it("should throw for quantity ZodError", async () => {
      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: -1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.orderItem.findUnique).mockRejectedValueOnce("Fail")
      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })

    it("should handle generic ZodError", async () => {
      const result = await updateCartItemAction({ itemId: ITEM_ID_1, quantity: "bad" as never })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })
  })

  describe("removeFromCartAction", () => {
    it("should remove item successfully", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: USER_ID },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      vi.mocked(db.orderItem.delete).mockResolvedValue(mockItem)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(result.success).toBe(true)
      expect(db.orderItem.delete).toHaveBeenCalled()
    })

    it("should use default multiplier in removeFromCartAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: USER_ID },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      vi.mocked(db.orderItem.delete).mockResolvedValue(mockItem)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))

      const result = await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(result.success).toBe(true)
      expect(db.order.findUniqueOrThrow).toHaveBeenCalled()
    })

    it("should throw error if not owner", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const mockItem = mockOrderItemWithOrder({
        id: ITEM_ID_1,
        orderId: CART_ID,
        order: { userId: "other-user" },
      })
      vi.mocked(db.orderItem.findUnique).mockResolvedValue(mockItem)
      const result = await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN")
      }
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      const result = await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.orderItem.findUnique).mockRejectedValueOnce("Fail")
      const result = await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })

    it("should throw for ZodError", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      const result = await removeFromCartAction({ itemId: "invalid" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })
  })

  describe("batchAddToCartAction", () => {
    it("should add multiple itemssuccessfully", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.orderItem.create).mockResolvedValue(mockOrderItemWithProduct({ id: ITEM_ID_1 }))
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      // Transaction mock is already in beforeEach

      const result = await batchAddToCartAction({
        productIds: [PRODUCT_ID_1, PRODUCT_ID_2],
        quantities: [1, 2],
      })
      expect(result.success).toBe(true)
      expect(db.orderItem.create).toHaveBeenCalledTimes(2)
    })

    it("should use default multiplier in batchAddToCartAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.orderItem.create).mockResolvedValue(mockOrderItemWithProduct({ id: ITEM_ID_1 }))
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      // Transaction mock is already in beforeEach

      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: [1] })
      expect(result.success).toBe(true)
      expect(db.order.findUniqueOrThrow).toHaveBeenCalled()
    })

    it("should update quantity if item already exists in batch", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(
        mockOrderItemWithProduct({ id: "existing" })
      )
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)

      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: [5] })
      expect(result.success).toBe(true)
      expect(db.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "existing" }, data: { quantity: 6 } })
      )
    })

    it("should work when quantities is a number", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      const result = await batchAddToCartAction({
        productIds: [PRODUCT_ID_1, PRODUCT_ID_2],
        quantities: 3,
      })
      expect(result.success).toBe(true)
      expect(db.orderItem.create).toHaveBeenCalledTimes(2)
    })

    it("should work when quantities is omitted", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct)
      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1] })
      expect(result.success).toBe(true)
      expect(db.orderItem.create).toHaveBeenCalled()
    })

    it("should handle createCart failure", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.order.create).mockResolvedValue(null as never)
      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should throw error if not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN")
      }
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })

    it("should handle quantity too small ZodError", async () => {
      const result = await batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: [0] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should handle generic ZodError", async () => {
      const result = await batchAddToCartAction({
        productIds: [PRODUCT_ID_1],
        quantities: "bad" as never,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })
  })

  describe("clearCartAction", () => {
    it("should clear cart successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart)
      const result = await clearCartAction()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(CART_ID)
      }
      expect(db.orderItem.deleteMany).toHaveBeenCalled()
    })

    it("should create cart if none exists during clear", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.order.create).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      const result = await clearCartAction()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe(CART_ID)
      }
    })

    it("should handle createCart failure during clear", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as never)
      vi.mocked(db.order.create).mockResolvedValue(null as never)
      const result = await clearCartAction()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      const result = await clearCartAction()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })
  })

  describe("getCartAction", () => {
    it("should fetch cart successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCartWithItems({ id: CART_ID }))
      const result = await getCartAction()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe(CART_ID)
      }
    })

    it("should return null if no cart exists", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as never)
      const result = await getCartAction()
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeNull()
      }
    })

    it("should return error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      const result = await getCartAction()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      const result = await getCartAction()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("FORBIDDEN")
      }
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      const result = await getCartAction()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
      }
    })
  })
})
