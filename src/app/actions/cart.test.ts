import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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
  calculateCartTotal: vi.fn(
    (items: Array<{ product?: { price: number | null } | null; quantity: number }>) => {
      return items.reduce((total: number, item) => {
        if (item.product?.price === null) return total
        return total + (item.product?.price ?? 0) * item.quantity
      }, 0)
    }
  ),
  applyPriceMultiplierToItems: vi.fn((items: any[], multiplier: number) => {
    return items.map((item) => ({
      ...item,
      product: item.product
        ? {
            ...item.product,
            price:
              item.product.price === null
                ? null
                : Math.round(item.product.price * multiplier * 100) / 100,
          }
        : null,
    }))
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { applyPriceMultiplierToItems, calculateCartTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
// Now import the modules
import {
  addToCartAction,
  batchAddToCartAction,
  clearCartAction,
  removeFromCartAction,
  updateCartItemAction,
} from "./cart"

describe("Cart Actions", () => {
  // Type helpers for test mocks - suppress strict typing in tests
  // biome-ignore lint/suspicious/noExplicitAny: Intentional for test mocks
  const mockOrderItem = (item: any) => item as any
  // biome-ignore lint/suspicious/noExplicitAny: Intentional for test mocks
  const mockOrder = (order: any) => order as any
  // biome-ignore lint/suspicious/noExplicitAny: Intentional for test mocks
  const mockProductData = (product: any) => product as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()

  describe("addToCartAction", () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      approved: true,
      priceMultiplier: 1.0,
    }

    const mockProduct = {
      id: "product-1",
      name: "Roses",
      slug: "roses",
      description: "Beautiful roses",
      image: "roses.jpg",
      price: 49.99,
      colors: ["red"],
      productType: "FLOWER" as const,
      featured: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    const mockCart = {
      id: "cart-1",
      userId: mockUser.id,
      orderNumber: 1,
      status: "CART" as OrderStatus,
      notes: null,
      deliveryAddressId: "address-1",
      createdAt: now,
      updatedAt: now,
      items: [],
    }

    it("should throw error if user is not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

      await expect(addToCartAction("product-1", 1)).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        ...mockUser,
        approved: false,
      })

      await expect(addToCartAction("product-1", 1)).rejects.toThrow(
        "Your account is not approved for purchases"
      )
    })

    it("should throw error if product does not exist", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockCart)
      vi.mocked(db.product.findUnique).mockResolvedValueOnce(null)

      await expect(addToCartAction("nonexistent-product", 1)).rejects.toThrow("Product not found")
    })

    it("should create new item in existing cart", async () => {
      const newItem = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 2,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.product.findUnique).mockResolvedValueOnce(mockProductData(mockProduct))
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.orderItem.create).mockResolvedValueOnce(mockOrderItem(newItem))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [newItem],
        })
      )

      const result = await addToCartAction(mockProduct.id, 2)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].quantity).toBe(2)
      expect(db.orderItem.create).toHaveBeenCalledWith({
        data: {
          orderId: mockCart.id,
          productId: mockProduct.id,
          quantity: 2,
          price: null,
        },
      })
    })

    it("should update quantity if product already in cart", async () => {
      const existingItem = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      const updatedItem = { ...existingItem, quantity: 3 }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.product.findUnique).mockResolvedValueOnce(mockProductData(mockProduct))
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(mockOrderItem(existingItem))
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(mockOrderItem(updatedItem))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [updatedItem],
        })
      )

      const result = await addToCartAction(mockProduct.id, 3)

      expect(result.items[0].quantity).toBe(3)
      expect(db.orderItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { quantity: 3 },
      })
    })

    it("should create new cart if none exists", async () => {
      const newCart = { ...mockCart, id: "cart-new" }
      const newItem = {
        id: "item-1",
        orderId: newCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.order.create).mockResolvedValueOnce(
        mockOrder({
          ...newCart,
          items: [],
        })
      )
      vi.mocked(db.product.findUnique).mockResolvedValueOnce(mockProductData(mockProduct))
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.orderItem.create).mockResolvedValueOnce(mockOrderItem(newItem))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...newCart,
          items: [newItem],
        })
      )

      const result = await addToCartAction(mockProduct.id, 1)

      expect(result.id).toBe(newCart.id)
    })

    it("should apply price multiplier to items", async () => {
      const userWithMultiplier = { ...mockUser, priceMultiplier: 1.5 }
      const item = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
        product: mockProduct,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(userWithMultiplier)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.product.findUnique).mockResolvedValueOnce(mockProductData(mockProduct))
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.orderItem.create).mockResolvedValueOnce(mockOrderItem(item))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [item],
        })
      )

      const result = await addToCartAction(mockProduct.id, 1)

      // Price should be multiplied: 49.99 * 1.5 = 74.985 (rounded to 74.99)
      expect(result.items[0].product?.price).toBeCloseTo(74.99, 1)
    })

    it("should calculate correct cart total", async () => {
      const item = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 2,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
        product: mockProduct,
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.product.findUnique).mockResolvedValueOnce(mockProductData(mockProduct))
      vi.mocked(db.orderItem.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.orderItem.create).mockResolvedValueOnce(mockOrderItem(item))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [item],
        })
      )

      const result = await addToCartAction(mockProduct.id, 2)

      // 49.99 * 2 = 99.98
      expect(result.total).toBe(99.98)
      expect(calculateCartTotal).toHaveBeenCalled()
    })
  })

  describe("updateCartItemAction", () => {
    const mockUser = { id: "user-1", email: "test@example.com", priceMultiplier: 1.0 }
    const mockCart = {
      id: "cart-1",
      userId: mockUser.id,
      orderNumber: 1,
      status: "CART" as OrderStatus,
      notes: null,
      deliveryAddressId: "address-1",
      createdAt: now,
      updatedAt: now,
      items: [],
    }
    const mockProduct = {
      id: "product-1",
      name: "Roses",
      slug: "roses",
      description: "Beautiful roses",
      image: "roses.jpg",
      price: 49.99,
      colors: ["red"],
      productType: "FLOWER" as const,
      featured: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    it("should update item quantity", async () => {
      const existingItem = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      const updatedItem = { ...existingItem, quantity: 5 }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrderItem({
          ...existingItem,
          order: mockCart,
          product: mockProduct,
        })
      )
      vi.mocked(db.orderItem.update).mockResolvedValueOnce(mockOrderItem(updatedItem))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [updatedItem],
        })
      )

      const result = await updateCartItemAction("item-1", 5)

      expect(result.items[0].quantity).toBe(5)
      expect(db.orderItem.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { quantity: 5 },
      })
    })

    it("should delete item if quantity is 0", async () => {
      const existingItem = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrderItem({
          ...existingItem,
          order: mockCart,
          product: mockProduct,
        })
      )
      vi.mocked(db.orderItem.delete).mockResolvedValueOnce(mockOrderItem(existingItem))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [],
        })
      )

      const result = await updateCartItemAction("item-1", 0)

      expect(db.orderItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } })
      expect(result.items).toHaveLength(0)
    })

    it("should throw error if item does not belong to user", async () => {
      const otherUserCart = { ...mockCart, userId: "other-user-id" }
      const existingItem = {
        id: "item-1",
        orderId: otherUserCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrderItem({
          ...existingItem,
          order: otherUserCart,
          product: mockProduct,
        })
      )

      await expect(updateCartItemAction("item-1", 2)).rejects.toThrow("Unauthorized")
    })
  })

  describe("removeFromCartAction", () => {
    const mockUser = { id: "user-1", email: "test@example.com", priceMultiplier: 1.0 }
    const mockCart = {
      id: "cart-1",
      userId: mockUser.id,
      orderNumber: 1,
      status: "CART" as OrderStatus,
      notes: null,
      deliveryAddressId: "address-1",
      createdAt: now,
      updatedAt: now,
      items: [],
    }
    const mockProduct = {
      id: "product-1",
      name: "Roses",
      slug: "roses",
      description: "Beautiful roses",
      image: "roses.jpg",
      price: 49.99,
      colors: ["red"],
      productType: "FLOWER" as const,
      featured: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    it("should remove item from cart", async () => {
      const item = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct.id,
        quantity: 2,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrderItem({
          ...item,
          order: mockCart,
          product: mockProduct,
        })
      )
      vi.mocked(db.orderItem.delete).mockResolvedValueOnce(mockOrderItem(item))
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [],
        })
      )

      const result = await removeFromCartAction("item-1")

      expect(db.orderItem.delete).toHaveBeenCalledWith({ where: { id: "item-1" } })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it("should throw error if item does not belong to user", async () => {
      const otherUserCart = { ...mockCart, userId: "other-user-id" }
      const item = {
        id: "item-1",
        orderId: otherUserCart.id,
        productId: mockProduct.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.orderItem.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrderItem({
          ...item,
          order: otherUserCart,
          product: mockProduct,
        })
      )

      await expect(removeFromCartAction("item-1")).rejects.toThrow("Unauthorized")
    })
  })

  describe("clearCartAction", () => {
    const mockUser = { id: "user-1", email: "test@example.com", priceMultiplier: 1.0 }
    const mockCart = {
      id: "cart-1",
      userId: mockUser.id,
      orderNumber: 1,
      status: "CART" as OrderStatus,
      notes: null,
      deliveryAddressId: "address-1",
      createdAt: now,
      updatedAt: now,
      items: [],
    }

    it("should throw error if user not authenticated", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)

      await expect(clearCartAction()).rejects.toThrow("Unauthorized")
    })

    it("should delete all items from cart", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.orderItem.deleteMany).mockResolvedValueOnce({ count: 3 })

      const result = await clearCartAction()

      expect(db.orderItem.deleteMany).toHaveBeenCalledWith({
        where: { orderId: mockCart.id },
      })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it("should create new cart if none exists", async () => {
      const newCart = { ...mockCart, id: "cart-new" }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(null)
      vi.mocked(db.order.create).mockResolvedValueOnce(
        mockOrder({
          ...newCart,
          items: [],
        })
      )

      const result = await clearCartAction()

      expect(result.id).toBe(newCart.id)
      expect(result.items).toHaveLength(0)
    })
  })

  describe("batchAddToCartAction", () => {
    const mockUser = {
      id: "user-1",
      email: "test@example.com",
      priceMultiplier: 1.0,
      approved: true,
    }
    const mockCart = {
      id: "cart-1",
      userId: mockUser.id,
      orderNumber: 1,
      status: "CART" as OrderStatus,
      notes: null,
      deliveryAddressId: "address-1",
      createdAt: now,
      updatedAt: now,
      items: [],
    }
    const mockProduct1 = {
      id: "product-1",
      name: "Roses",
      slug: "roses",
      description: "Beautiful roses",
      image: "roses.jpg",
      price: 49.99,
      colors: ["red"],
      productType: "FLOWER" as const,
      featured: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }
    const mockProduct2 = {
      id: "product-2",
      name: "Tulips",
      slug: "tulips",
      description: "Beautiful tulips",
      image: "tulips.jpg",
      price: 39.99,
      colors: ["purple"],
      productType: "FLOWER" as const,
      featured: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    it("should throw error if user not approved", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce({
        ...mockUser,
        approved: false,
      })

      await expect(batchAddToCartAction(["product-1", "product-2"], [1, 2])).rejects.toThrow(
        "Your account is not approved for purchases"
      )
    })

    it("should throw error if productIds is empty", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      await expect(batchAddToCartAction([], [1, 2])).rejects.toThrow(
        "productIds must be a non-empty array"
      )
    })

    it("should throw error if quantities length does not match productIds", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)

      await expect(batchAddToCartAction(["product-1", "product-2"], [1])).rejects.toThrow(
        "quantities array length must match productIds"
      )
    })

    it("should add multiple items with single quantity", async () => {
      const item1 = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct1.id,
        quantity: 2,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }
      const item2 = {
        id: "item-2",
        orderId: mockCart.id,
        productId: mockProduct2.id,
        quantity: 2,
        price: null,
        productNameSnapshot: "Tulips",
        productImageSnapshot: "tulips.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.$transaction).mockImplementationOnce(async (fn) => {
        return fn({
          orderItem: {
            findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(item1).mockResolvedValueOnce(item2),
            update: vi.fn(),
          },
          // biome-ignore lint/suspicious/noExplicitAny: Intentional for test mocks
        } as any)
      })
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [item1, item2],
        })
      )

      const result = await batchAddToCartAction(["product-1", "product-2"], 2)

      expect(result.items).toHaveLength(2)
      expect(db.$transaction).toHaveBeenCalled()
    })

    it("should add multiple items with per-item quantities", async () => {
      const item1 = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct1.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }
      const item2 = {
        id: "item-2",
        orderId: mockCart.id,
        productId: mockProduct2.id,
        quantity: 3,
        price: null,
        productNameSnapshot: "Tulips",
        productImageSnapshot: "tulips.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.$transaction).mockImplementationOnce(async (fn) => {
        return fn({
          orderItem: {
            findFirst: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(item1).mockResolvedValueOnce(item2),
            update: vi.fn(),
          },
          // biome-ignore lint/suspicious/noExplicitAny: Intentional for test mocks
        } as any)
      })
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [item1, item2],
        })
      )

      const result = await batchAddToCartAction(["product-1", "product-2"], [1, 3])

      expect(result.items).toHaveLength(2)
      expect(result.items[0].quantity).toBe(1)
      expect(result.items[1].quantity).toBe(3)
    })

    it("should use default quantity of 1 if not provided", async () => {
      const item1 = {
        id: "item-1",
        orderId: mockCart.id,
        productId: mockProduct1.id,
        quantity: 1,
        price: null,
        productNameSnapshot: "Roses",
        productImageSnapshot: "roses.jpg",
      }

      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(db.order.findFirst).mockResolvedValueOnce(mockOrder(mockCart))
      vi.mocked(db.$transaction).mockImplementationOnce(async (fn) => {
        return fn({
          orderItem: {
            findFirst: vi.fn().mockResolvedValueOnce(null),
            create: vi.fn().mockResolvedValueOnce(item1),
            update: vi.fn(),
          },
          // biome-ignore lint/suspicious/noExplicitAny: Intentional for test mocks
        } as any)
      })
      vi.mocked(db.order.findUniqueOrThrow).mockResolvedValueOnce(
        mockOrder({
          ...mockCart,
          items: [item1],
        })
      )

      const result = await batchAddToCartAction(["product-1"])

      expect(result.items[0].quantity).toBe(1)
    })
  })
})
