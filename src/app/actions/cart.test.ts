import { beforeEach, describe, expect, it, vi } from "vitest"
import type { OrderStatus } from "@/generated/enums"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/lib/cart-utils", () => ({
  calculateCartTotal: vi.fn((items: any[]) => items.length * 10),
  applyPriceMultiplierToItems: vi.fn((items: any[], multiplier: number) =>
    items.map((item: any) => ({
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

  const mockUser = {
    id: USER_ID,
    email: "test@example.com",
    approved: true,
    priceMultiplier: 1.0,
  }

  const mockProduct = {
    id: PRODUCT_ID_1,
    name: "Product 1",
    price: 10,
  }

  const mockCart = {
    id: CART_ID,
    userId: USER_ID,
    status: "CART" as OrderStatus,
    items: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser)
    vi.mocked(db.$transaction).mockImplementation((fn: any) => fn(db))
    vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as any)
  })

  describe("addToCartAction", () => {
    it("should add to cart successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(result.id).toBe(CART_ID)
    })

    it("should update quantity if item already exists", async () => {
      const existingItem = { id: ITEM_ID_1, orderId: CART_ID, productId: PRODUCT_ID_1, quantity: 1 }
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(existingItem as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      const result = await addToCartAction({ productId: PRODUCT_ID_1, quantity: 5 })
      expect(result.id).toBe(CART_ID)
      expect(db.orderItem.update).toHaveBeenCalled()
    })

    it("should handle createCart and default multiplier", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        ...mockUser,
        priceMultiplier: undefined,
      })
      vi.mocked(db.order.findFirst).mockResolvedValue(null as any)
      vi.mocked(db.order.create).mockResolvedValue(mockCart as any)
      vi.mocked(db.product.findUnique).mockResolvedValue(mockProduct as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      await addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })
      expect(db.order.create).toHaveBeenCalled()
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })).rejects.toThrow(
        "Unauthorized"
      )
    })

    it("should throw error if not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })).rejects.toThrow(
        "Your account is not approved for purchases"
      )
    })

    it("should throw error if product not found in DB", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.product.findUnique).mockResolvedValue(null)
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })).rejects.toThrow(
        "Product not found"
      )
    })

    it("should handle createCart failure", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as any)
      vi.mocked(db.order.create).mockResolvedValue(null as any)
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })).rejects.toThrow(
        "Failed to create cart"
      )
    })

    it("should throw specifically for productId Zod error", async () => {
      await expect(addToCartAction({ productId: "not-a-uuid", quantity: 1 })).rejects.toThrow(
        "Product not found"
      )
    })

    it("should throw specifically for quantity Zod error", async () => {
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 0 })).rejects.toThrow(
        "Quantity must be at least 1"
      )
    })

    it("should handle generic ZodError", async () => {
      await expect(
        addToCartAction({ productId: PRODUCT_ID_1, quantity: "bad" as never })
      ).rejects.toThrow("Invalid product data")
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })).rejects.toThrow(
        "Failed to add to cart"
      )
    })

    it("should handle generic Error in addToCartAction catch block", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce(new Error("Custom DB Error"))
      await expect(addToCartAction({ productId: PRODUCT_ID_1, quantity: 1 })).rejects.toThrow(
        "Custom DB Error"
      )
    })
  })

  describe("updateCartItemAction", () => {
    it("should update quantity successfully", async () => {
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: USER_ID } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 5 })
      expect(db.orderItem.update).toHaveBeenCalled()
    })

    it("should use default multiplier in updateCartItemAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        ...mockUser,
        priceMultiplier: undefined,
      })
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: USER_ID } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 5 })
      expect(db.order.findUniqueOrThrow).toHaveBeenCalled()
    })

    it("should delete item if quantity is 0", async () => {
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: USER_ID } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      await updateCartItemAction({ itemId: ITEM_ID_1, quantity: 0 })
      expect(db.orderItem.delete).toHaveBeenCalled()
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      await expect(updateCartItemAction({ itemId: ITEM_ID_1, quantity: 1 })).rejects.toThrow(
        "Unauthorized"
      )
    })

    it("should throw error if not owner", async () => {
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: "other" } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      await expect(updateCartItemAction({ itemId: ITEM_ID_1, quantity: 1 })).rejects.toThrow(
        "Unauthorized"
      )
    })

    it("should throw for quantity ZodError", async () => {
      await expect(updateCartItemAction({ itemId: ITEM_ID_1, quantity: -1 })).rejects.toThrow(
        "Quantity must be at least 0"
      )
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.orderItem.findUniqueOrThrow).mockRejectedValueOnce("Fail")
      await expect(updateCartItemAction({ itemId: ITEM_ID_1, quantity: 1 })).rejects.toThrow(
        "Failed to update cart item"
      )
    })

    it("should handle generic ZodError", async () => {
      await expect(
        updateCartItemAction({ itemId: ITEM_ID_1, quantity: "bad" as never })
      ).rejects.toThrow("Invalid cart item data")
    })
  })

  describe("removeFromCartAction", () => {
    it("should remove item successfully", async () => {
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: USER_ID } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(db.orderItem.delete).toHaveBeenCalled()
    })

    it("should use default multiplier in removeFromCartAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        ...mockUser,
        priceMultiplier: undefined,
      })
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: USER_ID } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)

      await removeFromCartAction({ itemId: ITEM_ID_1 })
      expect(db.order.findUniqueOrThrow).toHaveBeenCalled()
    })

    it("should throw error if not owner", async () => {
      const mockItem = { id: ITEM_ID_1, orderId: CART_ID, order: { userId: "other" } }
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValue(mockItem as any)
      await expect(removeFromCartAction({ itemId: ITEM_ID_1 })).rejects.toThrow("Unauthorized")
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      await expect(removeFromCartAction({ itemId: ITEM_ID_1 })).rejects.toThrow("Unauthorized")
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.orderItem.findUniqueOrThrow).mockRejectedValueOnce("Fail")
      await expect(removeFromCartAction({ itemId: ITEM_ID_1 })).rejects.toThrow(
        "Failed to remove item from cart"
      )
    })

    it("should throw for ZodError", async () => {
      await expect(removeFromCartAction({ itemId: "invalid" })).rejects.toThrow(
        "Invalid cart item data"
      )
    })
  })

  describe("batchAddToCartAction", () => {
    it("should add multiple itemssuccessfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as any)

      await batchAddToCartAction({ productIds: [PRODUCT_ID_1, PRODUCT_ID_2], quantities: [1, 2] })
      expect(db.orderItem.create).toHaveBeenCalledTimes(2)
    })

    it("should use default multiplier in batchAddToCartAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        ...mockUser,
        priceMultiplier: undefined,
      })
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as any)

      await batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: [1] })
      expect(db.order.findUniqueOrThrow).toHaveBeenCalled()
    })

    it("should update quantity if item already exists in batch", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue({ id: "existing" } as any)

      await batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: [5] })
      expect(db.orderItem.update).toHaveBeenCalled()
    })

    it("should work when quantities is a number", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as any)
      await batchAddToCartAction({ productIds: [PRODUCT_ID_1, PRODUCT_ID_2], quantities: 3 })
      expect(db.orderItem.create).toHaveBeenCalledTimes(2)
    })

    it("should work when quantities is omitted", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValue({ ...mockCart, items: [] } as any)
      vi.mocked(db.orderItem.findFirst).mockResolvedValue(null as any)
      await batchAddToCartAction({ productIds: [PRODUCT_ID_1] })
      expect(db.orderItem.create).toHaveBeenCalled()
    })

    it("should handle createCart failure", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as any)
      vi.mocked(db.order.create).mockResolvedValue(null as any)
      await expect(batchAddToCartAction({ productIds: [PRODUCT_ID_1] })).rejects.toThrow(
        "Failed to create cart"
      )
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      await expect(batchAddToCartAction({ productIds: [PRODUCT_ID_1] })).rejects.toThrow(
        "Unauthorized"
      )
    })

    it("should throw error if not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      await expect(batchAddToCartAction({ productIds: [PRODUCT_ID_1] })).rejects.toThrow(
        "Your account is not approved for purchases"
      )
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      await expect(batchAddToCartAction({ productIds: [PRODUCT_ID_1] })).rejects.toThrow(
        "Failed to add items to cart"
      )
    })

    it("should handle quantity too small ZodError", async () => {
      await expect(
        batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: [0] })
      ).rejects.toThrow("Quantity must be at least 1")
    })

    it("should handle generic ZodError", async () => {
      await expect(
        batchAddToCartAction({ productIds: [PRODUCT_ID_1], quantities: "bad" as never })
      ).rejects.toThrow("Invalid product data")
    })
  })

  describe("clearCartAction", () => {
    it("should clear cart successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(mockCart as any)
      const result = await clearCartAction()
      expect(db.orderItem.deleteMany).toHaveBeenCalled()
      expect(result.id).toBe(CART_ID)
    })

    it("should create cart if none exists during clear", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as any)
      vi.mocked(db.order.create).mockResolvedValue(mockCart as any)
      const result = await clearCartAction()
      expect(result.id).toBe(CART_ID)
    })

    it("should handle createCart failure during clear", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as any)
      vi.mocked(db.order.create).mockResolvedValue(null as any)
      await expect(clearCartAction()).rejects.toThrow("Failed to create cart")
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      await expect(clearCartAction()).rejects.toThrow("Failed to clear cart")
    })
  })

  describe("getCartAction", () => {
    it("should fetch cart successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue({ ...mockCart, items: [] } as any)
      const result = await getCartAction()
      expect(result?.id).toBe(CART_ID)
    })

    it("should return null if no cart exists", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValue(null as any)
      const result = await getCartAction()
      expect(result).toBeNull()
    })

    it("should throw error if session missing", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      await expect(getCartAction()).rejects.toThrow("Unauthorized")
    })

    it("should throw error if not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, approved: false })
      await expect(getCartAction()).rejects.toThrow("Your account is not approved for purchases")
    })

    it("should handle non-Error exception", async () => {
      vi.mocked(db.order.findFirst).mockRejectedValueOnce("Fail")
      await expect(getCartAction()).rejects.toThrow("Failed to fetch cart")
    })
  })
})
