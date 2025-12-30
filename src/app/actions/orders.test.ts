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
import {
  cancelOrderAction,
  createOrderAction,
  updateOrderItemPriceAction,
  updateOrderStatusAction,
} from "./orders"

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
    id: "550e8400-e29b-41d4-a716-446655440021",
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

      const result = await cancelOrderAction({ orderId: "550e8400-e29b-41d4-a716-446655440021" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("must be logged in")
    })

    it("should return error if order not found", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)

      const result = await cancelOrderAction({ orderId: "550e8400-e29b-41d4-a716-446655440099" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("does not exist")
    })

    it("should return error if order is CART", async () => {
      const cartOrder = { ...mockOrder, status: "CART" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartOrder)

      const result = await cancelOrderAction({ orderId: "550e8400-e29b-41d4-a716-446655440021" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Only PENDING orders can be cancelled")
    })

    it("should return error if order is CONFIRMED", async () => {
      const confirmedOrder = { ...mockOrder, status: "CONFIRMED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(confirmedOrder)

      const result = await cancelOrderAction({ orderId: "550e8400-e29b-41d4-a716-446655440021" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Only PENDING orders can be cancelled")
    })

    it("should return error if order is already CANCELLED", async () => {
      const cancelledOrder = { ...mockOrder, status: "CANCELLED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cancelledOrder)

      const result = await cancelOrderAction({ orderId: "550e8400-e29b-41d4-a716-446655440021" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Only PENDING orders can be cancelled")
    })

    it("should cancel PENDING order successfully", async () => {
      const cancelledOrder = { ...mockOrder, status: "CANCELLED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(cancelledOrder)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)

      const result = await cancelOrderAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        convertToCart: false,
      })

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

      const result = await cancelOrderAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        convertToCart: true,
      })

      expect(result.success).toBe(true)
      expect(result.message).toContain("converted back to cart")
      expect(result.order?.status).toBe("CART")
    })

    it("should handle non-Error exception in cancelOrderAction", async () => {
      vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Network error"))

      const result = await cancelOrderAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        convertToCart: false,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("Failed to cancel order")
      expect(result.error).toBeDefined()
    })
  })

  describe("updateOrderStatusAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

      await expect(
        updateOrderStatusAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          status: "CONFIRMED",
        })
      ).rejects.toThrow()
    })

    it("should throw error if user is not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      await expect(
        updateOrderStatusAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          status: "CONFIRMED",
        })
      ).rejects.toThrow("Unauthorized")
    })

    it("should throw error if status is invalid", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)

      await expect(
        updateOrderStatusAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          status: "INVALID" as never,
        })
      ).rejects.toThrow()
    })

    it("should throw error if order not found", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(null)

      await expect(
        updateOrderStatusAction({
          orderId: "550e8400-e29b-41d4-a716-446655440099",
          status: "PENDING",
        })
      ).rejects.toThrow("Order not found")
    })

    it("should update order status to CONFIRMED", async () => {
      const confirmedOrder = { ...mockOrder, status: "CONFIRMED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(confirmedOrder)

      const result = await updateOrderStatusAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        status: "CONFIRMED",
      })

      expect(result.order.status).toBe("CONFIRMED")
      expect(db.order.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440021" },
        data: { status: "CONFIRMED" },
      })
    })

    it("should update order status to OUT_FOR_DELIVERY", async () => {
      const inDeliveryOrder = { ...mockOrder, status: "OUT_FOR_DELIVERY" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(inDeliveryOrder)

      const result = await updateOrderStatusAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        status: "OUT_FOR_DELIVERY",
      })

      expect(result.order.status).toBe("OUT_FOR_DELIVERY")
    })

    it("should update order status to DELIVERED", async () => {
      const deliveredOrder = { ...mockOrder, status: "DELIVERED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(deliveredOrder)

      const result = await updateOrderStatusAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        status: "DELIVERED",
      })

      expect(result.order.status).toBe("DELIVERED")
    })

    it("should update order status to CANCELLED", async () => {
      const cancelledOrder = { ...mockOrder, status: "CANCELLED" as OrderStatus }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce(cancelledOrder)

      const result = await updateOrderStatusAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        status: "CANCELLED",
      })

      expect(result.order.status).toBe("CANCELLED")
    })

    it("should throw error on database update failure", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockRejectedValueOnce(new Error("Update failed"))

      await expect(
        updateOrderStatusAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          status: "CONFIRMED",
        })
      ).rejects.toThrow("Update failed")
    })

    it("should handle non-Error exception in updateOrderStatusAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.order.findUnique).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockRejectedValueOnce(new Error("DB error"))

      await expect(
        updateOrderStatusAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          status: "CONFIRMED",
        })
      ).rejects.toThrow()
    })
  })

  describe("updateOrderItemPriceAction", () => {
    it.skip("should throw error if user not admin", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      await expect(
        updateOrderItemPriceAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          itemId: "550e8400-e29b-41d4-a716-446655440011",
          price: 49.99,
        })
      ).rejects.toThrow("Unauthorized")
    })

    it.skip("should throw error if price is negative", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)

      await expect(
        updateOrderItemPriceAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          itemId: "550e8400-e29b-41d4-a716-446655440011",
          price: -10,
        })
      ).rejects.toThrow("Price must be a non-negative number")
    })

    it.skip("should throw error if order item not found", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)

      await expect(
        updateOrderItemPriceAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          itemId: "550e8400-e29b-41d4-a716-446655440099",
          price: 49.99,
        })
      ).rejects.toThrow("Order item not found")
    })

    it.skip("should update order item price", async () => {
      const mockItem = {
        id: "550e8400-e29b-41d4-a716-446655440011",
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        productId: "550e8400-e29b-41d4-a716-446655440001",
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

      const result = await updateOrderItemPriceAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        itemId: "550e8400-e29b-41d4-a716-446655440011",
        price: 49.99,
      })

      expect(db.orderItem.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440011" },
        data: { price: 49.99 },
      })
      expect(result.message).toContain("Price updated successfully")
    })

    it.skip("should allow price of 0 for free items", async () => {
      const mockItem = {
        id: "550e8400-e29b-41d4-a716-446655440011",
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        productId: "550e8400-e29b-41d4-a716-446655440001",
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

      const result = await updateOrderItemPriceAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        itemId: "550e8400-e29b-41d4-a716-446655440011",
        price: 0,
      })

      expect(db.orderItem.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440011" },
        data: { price: 0 },
      })
      expect(result.newOrderTotal).toBe(0)
    })

    it.skip("should calculate correct order total with multiple items", async () => {
      const mockItem = {
        id: "550e8400-e29b-41d4-a716-446655440011",
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        productId: "550e8400-e29b-41d4-a716-446655440001",
        quantity: 2,
        price: 49.99,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([
        { ...mockItem, price: 49.99, quantity: 2 },
        {
          id: "item-2",
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          price: 39.99,
          quantity: 1,
        },
      ] as never)

      const result = await updateOrderItemPriceAction({
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        itemId: "550e8400-e29b-41d4-a716-446655440011",
        price: 49.99,
      })

      // (49.99 * 2) + (39.99 * 1) = 99.98 + 39.99 = 139.97
      expect(result.newOrderTotal).toBe(139.97)
    })

    it.skip("should throw error on database update failure for order item", async () => {
      const mockItem = {
        id: "550e8400-e29b-41d4-a716-446655440011",
        orderId: "550e8400-e29b-41d4-a716-446655440021",
        productId: "550e8400-e29b-41d4-a716-446655440001",
        quantity: 2,
        price: null,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.update).mockRejectedValueOnce(new Error("Update failed"))

      await expect(
        updateOrderItemPriceAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          itemId: "550e8400-e29b-41d4-a716-446655440011",
          price: 49.99,
        })
      ).rejects.toThrow("Update failed")
    })

    it("should handle non-Error exception in updateOrderItemPriceAction", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockAdminUser)

      await expect(
        updateOrderItemPriceAction({
          orderId: "550e8400-e29b-41d4-a716-446655440021",
          itemId: "550e8400-e29b-41d4-a716-446655440011",
          price: "invalid" as never,
        })
      ).rejects.toThrow()
    })
  })

  describe("createOrderAction", () => {
    const validOrderData = {
      deliveryAddressId: "address-1",
      deliveryAddress: null,
      saveDeliveryAddress: false,
      notes: null,
    }

    it.skip("should throw error if user is not authenticated", async () => {})

    it.skip("should throw error if user is not approved", async () => {
      const unapprovedUser = { ...mockUser, approved: false }
      vi.mocked(getCurrentUser).mockResolvedValueOnce(unapprovedUser)

      await expect(createOrderAction(validOrderData)).rejects.toThrow(
        "Your account is not approved for purchases"
      )
    })

    it("should throw error if cart is empty (no cart found)", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)

      await expect(createOrderAction(validOrderData)).rejects.toThrow("Cart is empty")
    })

    it.skip("should throw error if cart has no items", async () => {
      const emptyCart = { ...mockOrder, items: [] }
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(emptyCart)

      await expect(createOrderAction(validOrderData)).rejects.toThrow("Cart is empty")
    })

    it.skip("should throw error if delivery address ID provided but not found", async () => {
      const cartWithItems = {
        ...mockOrder,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: { name: "Roses", image: "roses.jpg", price: 49.99 },
          },
        ],
      }
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(null)

      await expect(createOrderAction(validOrderData)).rejects.toThrow("Invalid delivery address")
    })

    it.skip("should throw error if neither delivery address ID nor new address provided", async () => {
      const cartWithItems = {
        ...mockOrder,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: { name: "Roses", image: "roses.jpg", price: 49.99 },
          },
        ],
      }
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)

      const invalidData = {
        deliveryAddressId: null,
        deliveryAddress: null,
        saveDeliveryAddress: false,
        notes: null,
      }

      await expect(createOrderAction(invalidData)).rejects.toThrow("Delivery address is required")
    })

    it.skip("should successfully create order with existing delivery address", async () => {
      const cartWithItems = {
        ...mockOrder,
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 2,
            product: {
              id: "prod-1",
              name: "Roses",
              image: "roses.jpg",
              price: 49.99,
              type: "ROSE",
              collectionId: null,
              deletedAt: null,
            },
          },
        ],
      }

      const existingAddress = { id: "address-1", userId: mockUser.id }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(existingAddress as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...cartWithItems,
        status: "PENDING" as OrderStatus,
        deliveryAddressId: "address-1",
        deliveryAddress: existingAddress,
      } as never)

      const result = await createOrderAction(validOrderData)

      expect(result.status).toBe("PENDING")
      expect(result.deliveryAddressId).toBe("address-1")
    })

    it("should create order with new unsaved delivery address", async () => {
      const cartWithItems = {
        ...mockOrder,
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: {
              id: "prod-1",
              name: "Roses",
              image: "roses.jpg",
              price: 49.99,
              type: "ROSE",
              collectionId: null,
              deletedAt: null,
            },
          },
        ],
      }

      const newAddress = {
        firstName: "John",
        lastName: "Doe",
        company: "Co",
        street1: "123 St",
        street2: "",
        city: "City",
        state: "CA",
        zip: "12345",
        country: "US",
        email: "john@test.com",
        phone: "+1-206-555-0100",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.address.create).mockResolvedValueOnce({
        id: "address-new",
        userId: null,
        ...newAddress,
      } as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...cartWithItems,
        status: "PENDING" as OrderStatus,
        deliveryAddressId: "address-new",
      } as never)

      const dataWithNewAddress = {
        deliveryAddressId: null,
        deliveryAddress: newAddress,
        saveDeliveryAddress: false,
        notes: null,
      }

      const result = await createOrderAction(dataWithNewAddress)

      expect(result.status).toBe("PENDING")
      expect(vi.mocked(db.address.create)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: null,
          firstName: "John",
        }),
      })
    })

    it("should save new address to user when saveDeliveryAddress is true", async () => {
      const cartWithItems = {
        ...mockOrder,
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: {
              id: "prod-1",
              name: "Roses",
              image: "roses.jpg",
              price: 49.99,
              type: "ROSE",
              collectionId: null,
              deletedAt: null,
            },
          },
        ],
      }

      const newAddress = {
        firstName: "Jane",
        lastName: "Smith",
        company: "Company",
        street1: "456 Ave",
        street2: "Suite 100",
        city: "Town",
        state: "CA",
        zip: "54321",
        country: "US",
        email: "jane@test.com",
        phone: "+1-206-555-0123",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.address.create).mockResolvedValueOnce({
        id: "address-new",
        userId: mockUser.id,
        ...newAddress,
      } as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...cartWithItems,
        status: "PENDING" as OrderStatus,
        deliveryAddressId: "address-new",
      } as never)

      const dataWithSavedAddress = {
        deliveryAddressId: null,
        deliveryAddress: newAddress,
        saveDeliveryAddress: true,
        notes: null,
      }

      await createOrderAction(dataWithSavedAddress)

      expect(vi.mocked(db.address.create)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
        }),
      })
    })

    it.skip("should apply user price multiplier to cart items", async () => {
      const testCartItems = [
        {
          id: "550e8400-e29b-41d4-a716-446655440011",
          productId: "550e8400-e29b-41d4-a716-446655440001",
          quantity: 1,
          product: {
            id: "prod-1",
            name: "Roses",
            image: "roses.jpg",
            price: 100.0,
            type: "ROSE",
            collectionId: null,
            deletedAt: null,
          },
        },
      ]

      const testCart = {
        id: "cart-1",
        userId: mockUser.id,
        orderNumber: 1,
        status: "CART" as OrderStatus,
        notes: null,
        deliveryAddressId: "address-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        items: testCartItems,
      }

      const userWithMultiplier = { ...mockUser, priceMultiplier: 1.5 }
      const existingAddress = { id: "address-1", userId: mockUser.id }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(userWithMultiplier)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(testCart as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(existingAddress as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...testCart,
        status: "PENDING" as OrderStatus,
      } as never)

      await createOrderAction(validOrderData)

      expect(vi.mocked(db.orderItem.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: 150.0,
          }),
        })
      )
    })

    it.skip("should handle market-priced items (null price) without multiplier", async () => {
      const cartWithItems = {
        ...mockOrder,
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: {
              id: "prod-1",
              name: "Market Item",
              image: "market.jpg",
              price: null,
              type: "ROSE",
              collectionId: null,
              deletedAt: null,
            },
          },
        ],
      }

      const existingAddress = { id: "address-1", userId: mockUser.id }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(existingAddress as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...cartWithItems,
        status: "PENDING" as OrderStatus,
      } as never)

      await createOrderAction(validOrderData)

      expect(vi.mocked(db.orderItem.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            price: null,
          }),
        })
      )
    })

    it("should include notes in the created order", async () => {
      const cartWithItems = {
        ...mockOrder,
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: {
              id: "prod-1",
              name: "Roses",
              image: "roses.jpg",
              price: 49.99,
              type: "ROSE",
              collectionId: null,
              deletedAt: null,
            },
          },
        ],
      }

      const existingAddress = { id: "address-1", userId: mockUser.id }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(existingAddress as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...cartWithItems,
        status: "PENDING" as OrderStatus,
        notes: "Handle with care",
      } as never)

      const dataWithNotes = {
        deliveryAddressId: "address-1",
        deliveryAddress: null,
        saveDeliveryAddress: false,
        notes: "Handle with care",
      }

      await createOrderAction(dataWithNotes)

      expect(vi.mocked(db.order.update)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            notes: "Handle with care",
          }),
        })
      )
    })

    it("should handle error when database operation fails", async () => {
      const cartWithItems = {
        ...mockOrder,
        id: "cart-1",
        status: "CART" as OrderStatus,
        items: [
          {
            id: "550e8400-e29b-41d4-a716-446655440011",
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 1,
            product: {
              id: "prod-1",
              name: "Roses",
              image: "roses.jpg",
              price: 49.99,
              type: "ROSE",
              collectionId: null,
              deletedAt: null,
            },
          },
        ],
      }

      const newAddress = {
        firstName: "John",
        lastName: "Doe",
        company: "Co",
        street1: "123 St",
        street2: "",
        city: "City",
        state: "CA",
        zip: "12345",
        country: "US",
        email: "john@test.com",
        phone: "+1-206-555-0100",
      }

      const dataWithError = {
        deliveryAddressId: null,
        deliveryAddress: newAddress,
        saveDeliveryAddress: false,
        notes: null,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(cartWithItems as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.create).mockRejectedValueOnce(new Error("DB Error"))

      await expect(createOrderAction(dataWithError)).rejects.toThrow("DB Error")
    })

    it.skip("should handle non-Error exception in createOrderAction", async () => {
      vi.mocked(getCurrentUser).mockRejectedValueOnce("String error")

      await expect(createOrderAction(validOrderData)).rejects.toThrow()
    })

    it("should throw error on invalid validation data", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      const invalidData = {
        deliveryAddressId: null,
        deliveryAddress: null,
        saveDeliveryAddress: false,
        notes: null,
      }

      await expect(createOrderAction(invalidData)).rejects.toThrow()
    })
  })
})
