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

vi.mock("@/lib/utils", () => ({
  adjustPrice: vi.fn((price, multiplier) => {
    return Math.round(price * multiplier * 100) / 100
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
// Now import the modules
import { cancelOrderAction, updateOrderItemPriceAction, updateOrderStatusAction } from "./orders"

describe("Order Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    approved: true,
    role: "CUSTOMER",
    priceMultiplier: 1.0,
  }

  const mockAdminUser = {
    ...mockUser,
    role: "ADMIN",
  }

  const mockOrder = {
    id: "order-1",
    userId: mockUser.id,
    orderNumber: 1,
    status: "PENDING" as OrderStatus,
    notes: null,
    deliveryAddressId: "address-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  }

  describe("cancelOrderAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

      const result = await cancelOrderAction("order-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("must be logged in")
    })

    it("should return error if order not found", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)

      const result = await cancelOrderAction("nonexistent-order")

      expect(result.success).toBe(false)
      expect(result.error).toContain("does not exist")
    })

    it("should return error if order is not PENDING", async () => {
      const cartOrder = { ...mockOrder, status: "CART" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartOrder)

      const result = await cancelOrderAction("order-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Only PENDING orders can be cancelled")
    })

    it("should cancel PENDING order successfully", async () => {
      const cancelledOrder = { ...mockOrder, status: "CANCELLED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(cancelledOrder)

      const result = await cancelOrderAction("order-1", false)

      expect(result.success).toBe(true)
      expect(result.message).toContain("cancelled successfully")
      expect(result.order?.status).toBe("CANCELLED")
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: "CANCELLED" },
      })
    })

    it("should convert order back to CART when convertToCart is true", async () => {
      const cartOrder = { ...mockOrder, status: "CART" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.order.update).mockResolvedValueOnce(cartOrder)

      const result = await cancelOrderAction("order-1", true)

      expect(result.success).toBe(true)
      expect(result.message).toContain("converted back to cart")
      expect(result.order?.status).toBe("CART")
    })
  })

  describe("updateOrderStatusAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

      await expect(updateOrderStatusAction("order-1", "CONFIRMED")).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      await expect(updateOrderStatusAction("order-1", "CONFIRMED")).rejects.toThrow("Unauthorized")
    })

    it("should throw error if status is invalid", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)

      await expect(updateOrderStatusAction("order-1", "INVALID" as never)).rejects.toThrow(
        "Invalid status"
      )
    })

    it("should throw error if order not found", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(null)

      await expect(updateOrderStatusAction("nonexistent", "PENDING")).rejects.toThrow(
        "Order not found"
      )
    })

    it("should update order status to CONFIRMED", async () => {
      const confirmedOrder = { ...mockOrder, status: "CONFIRMED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(confirmedOrder)

      const result = await updateOrderStatusAction("order-1", "CONFIRMED")

      expect(result.order.status).toBe("CONFIRMED")
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CONFIRMED" },
      })
    })

    it("should update order status to OUT_FOR_DELIVERY", async () => {
      const inDeliveryOrder = { ...mockOrder, status: "OUT_FOR_DELIVERY" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(inDeliveryOrder)

      const result = await updateOrderStatusAction("order-1", "OUT_FOR_DELIVERY")

      expect(result.order.status).toBe("OUT_FOR_DELIVERY")
    })

    it("should update order status to DELIVERED", async () => {
      const deliveredOrder = { ...mockOrder, status: "DELIVERED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(deliveredOrder)

      const result = await updateOrderStatusAction("order-1", "DELIVERED")

      expect(result.order.status).toBe("DELIVERED")
    })

    it("should update order status to CANCELLED", async () => {
      const cancelledOrder = { ...mockOrder, status: "CANCELLED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(cancelledOrder)

      const result = await updateOrderStatusAction("order-1", "CANCELLED")

      expect(result.order.status).toBe("CANCELLED")
    })
  })

  describe("updateOrderItemPriceAction", () => {
    it("should throw error if user not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      await expect(updateOrderItemPriceAction("order-1", "item-1", 49.99)).rejects.toThrow(
        "Unauthorized"
      )
    })

    it("should throw error if price is negative", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)

      await expect(updateOrderItemPriceAction("order-1", "item-1", -10)).rejects.toThrow(
        "Price must be a non-negative number"
      )
    })

    it("should throw error if order item not found", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)

      await expect(
        updateOrderItemPriceAction("order-1", "nonexistent-item", 49.99)
      ).rejects.toThrow("Order item not found")
    })

    it("should update order item price", async () => {
      const mockItem = {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 2,
        price: null,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.update).mockResolvedValueOnce({
        ...mockItem,
        price: 49.99,
      } as never)
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([
        { ...mockItem, price: 49.99 },
      ] as never)

      const result = await updateOrderItemPriceAction("order-1", "item-1", 49.99)

      expect(db.orderItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { price: 49.99 },
      })
      expect(result.message).toContain("Price updated successfully")
    })

    it("should allow price of 0 for free items", async () => {
      const mockItem = {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 1,
        price: 49.99,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.update).mockResolvedValueOnce({
        ...mockItem,
        price: 0,
      } as never)
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([{ ...mockItem, price: 0 }] as never)

      const result = await updateOrderItemPriceAction("order-1", "item-1", 0)

      expect(db.orderItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { price: 0 },
      })
      expect(result.newOrderTotal).toBe(0)
    })

    it("should calculate correct order total with multiple items", async () => {
      const mockItem = {
        id: "item-1",
        orderId: "order-1",
        productId: "product-1",
        quantity: 2,
        price: 49.99,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([
        { ...mockItem, price: 49.99, quantity: 2 },
        { id: "item-2", orderId: "order-1", price: 39.99, quantity: 1 },
      ] as never)

      const result = await updateOrderItemPriceAction("order-1", "item-1", 49.99)

      // (49.99 * 2) + (39.99 * 1) = 99.98 + 39.99 = 139.97
      expect(result.newOrderTotal).toBe(139.97)
    })
  })
})
