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

import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import {
  cancelOrderAction,
  createOrderAction,
  updateOrderItemPriceAction,
  updateOrderStatusAction,
} from "./orders"

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440001"
const VALID_UUID_2 = "550e8400-e29b-41d4-a716-446655440002"
const VALID_UUID_3 = "550e8400-e29b-41d4-a716-446655440003"

describe("Order Actions", () => {
  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    approved: true,
    role: Role.CUSTOMER,
    priceMultiplier: 1.0,
  }

  const mockAdminUser = {
    ...mockUser,
    role: Role.ADMIN,
  }

  const mockOrder = {
    id: VALID_UUID,
    userId: mockUser.id,
    orderNumber: 1,
    status: "PENDING" as OrderStatus,
    notes: null,
    deliveryAddressId: VALID_UUID_2,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  }

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

    it("should return error if order id is not uuid", async () => {
      const result = await cancelOrderAction({ orderId: "not-a-uuid" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should return error if order is not PENDING", async () => {
      const confirmedOrder = { ...mockOrder, status: "CONFIRMED" as OrderStatus }
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(confirmedOrder)
      const result = await cancelOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("CONFLICT")
      }
    })

    it("should cancel PENDING order successfully", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder)
      vi.mocked(db.order.update).mockResolvedValueOnce({ ...mockOrder, status: "CANCELLED" })
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)

      const result = await cancelOrderAction({ orderId: VALID_UUID })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("CANCELLED")
      }
    })

    it("should convert to cart successfully and clear snapshots", async () => {
      const orderWithItems = {
        ...mockOrder,
        items: [{ id: "item-1", productNameSnapshot: "Roses" }],
      }
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(orderWithItems as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...orderWithItems,
        status: "CART",
      } as never)

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
      vi.mocked(db.order.update).mockResolvedValueOnce({ ...mockOrder, status: "CONFIRMED" })
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        ...mockOrder,
        status: "CONFIRMED",
      })

      const result = await updateOrderStatusAction({ orderId: VALID_UUID, status: "CONFIRMED" })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("CONFIRMED")
      }
    })

    it("should return error for invalid Zod validation", async () => {
      const result = await updateOrderStatusAction({ orderId: "not-a-uuid", status: "CONFIRMED" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })
  })

  describe("updateOrderItemPriceAction", () => {
    const mockItem = {
      id: VALID_UUID_3,
      orderId: VALID_UUID,
      productId: VALID_UUID_2,
      quantity: 2,
      price: 0,
    }

    beforeEach(() => {
      vi.mocked(getCurrentUser).mockResolvedValue(mockAdminUser)
    })

    it("should update price and recalculate total including market prices", async () => {
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockItem as never)
      vi.mocked(db.orderItem.update).mockResolvedValueOnce({ ...mockItem, price: 50 } as never)
      vi.mocked(db.orderItem.findMany).mockResolvedValueOnce([
        { ...mockItem, price: 50, quantity: 2 },
        { id: "item-2", price: 0, quantity: 1 },
      ] as never)

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

    it("should return error for invalid Zod validation in updateOrderItemPriceAction", async () => {
      const result = await updateOrderItemPriceAction({
        orderId: "not-a-uuid",
        itemId: VALID_UUID_3,
        price: 50,
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("VALIDATION_ERROR")
      }
    })

    it("should return error when order item not found", async () => {
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null as never)

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

  describe("createOrderAction", () => {
    const validData = {
      deliveryAddressId: VALID_UUID_2,
      deliveryAddress: null,
      saveDeliveryAddress: false,
      notes: "Test note",
    }

    const mockCart = {
      ...mockOrder,
      id: "cart-1",
      status: "CART" as OrderStatus,
      items: [
        {
          id: VALID_UUID_3,
          productId: VALID_UUID_2,
          quantity: 2,
          product: { id: VALID_UUID_2, name: "Roses", image: "roses.jpg", price: 150 },
        },
      ],
    }

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
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce(null)
      const result = await createOrderAction(validData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("NOT_FOUND")
      }
    })

    it("should create order with existing address", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce({
        id: VALID_UUID_2,
        userId: mockUser.id,
      } as never)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        ...mockCart,
        status: "PENDING",
      } as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({ ...mockCart, status: "PENDING" } as never)

      const result = await createOrderAction(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("PENDING")
      }
    })

    it("should include notes if provided", async () => {
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce({
        id: VALID_UUID_2,
        userId: mockUser.id,
      } as never)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        ...mockCart,
        status: "PENDING",
      } as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...mockCart,
        status: "PENDING",
        notes: "Test note",
      } as never)

      await createOrderAction({ ...validData, notes: "Test note" })
      expect(db.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ notes: "Test note" }),
        })
      )
    })

    it("should handle market items and multiplier in createOrderAction", async () => {
      const marketCart = {
        ...mockCart,
        items: [
          { ...mockCart.items[0], product: { ...mockCart.items[0].product, price: 0 } },
          { id: "item-2", productId: VALID_UUID_3, quantity: 1, product: { id: "p2", price: 100 } },
        ],
      }
      vi.mocked(getCurrentUser).mockResolvedValueOnce({ ...mockUser, priceMultiplier: 1.5 })
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(marketCart as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.findFirst).mockResolvedValueOnce({
        id: VALID_UUID_2,
        userId: mockUser.id,
      } as never)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        ...marketCart,
        status: "PENDING",
      } as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({
        ...marketCart,
        status: "PENDING",
      } as never)

      await createOrderAction(validData)
      expect(db.orderItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: 150 }),
        })
      )
    })

    it("should create order with new address", async () => {
      const newAddr = {
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
      }
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.create).mockResolvedValueOnce({ id: "address-new" } as never)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        ...mockCart,
        status: "PENDING",
      } as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({ ...mockCart, status: "PENDING" } as never)

      const result = await createOrderAction({
        ...validData,
        deliveryAddressId: null,
        deliveryAddress: newAddr,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.status).toBe("PENDING")
      }
      expect(db.address.create).toHaveBeenCalled()
    })

    it("should save new address to user if saveDeliveryAddress is true", async () => {
      const newAddr = {
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
      }
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart as never)
      vi.mocked(db.orderItem.update).mockResolvedValue({} as never)
      vi.mocked(db.address.create).mockResolvedValueOnce({ id: "address-new" } as never)
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce({
        ...mockCart,
        status: "PENDING",
      } as never)
      vi.mocked(db.order.update).mockResolvedValueOnce({ ...mockCart, status: "PENDING" } as never)

      await createOrderAction({
        ...validData,
        deliveryAddressId: null,
        deliveryAddress: newAddr,
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
