import { beforeEach, describe, expect, it, vi } from "vitest"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
// Now import the modules
import {
  createProductAction,
  deleteProductAction,
  getProductCountAction,
  toggleProductFeaturedAction,
  updateProductAction,
} from "./products"

describe("Product Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockAdminSession = {
    session: {
      id: "session-1",
      createdAt: now,
      updatedAt: now,
      userId: "admin-1",
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      token: "token-1",
      ipAddress: "127.0.0.1",
      userAgent: "test",
    },
    user: {
      id: "admin-1",
      email: "admin@example.com",
      emailVerified: true,
      name: "Admin User",
      image: null,
      createdAt: now,
      updatedAt: now,
      approved: true,
      role: "ADMIN",
      priceMultiplier: 1,
    },
  }

  const mockProduct = {
    id: "product-1",
    name: "Roses",
    slug: "roses",
    description: "Beautiful red roses",
    image: "roses.jpg",
    price: 49.99,
    colors: ["red"],
    productType: "FLOWER" as const,
    featured: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  describe("createProductAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        image: "roses.jpg",
        price: "49.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: [],
      }

      await expect(createProductAction(data)).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
      const now = new Date()
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-1",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-1",
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
        user: {
          id: "user-1",
          email: "user@example.com",
          emailVerified: false,
          name: "User",
          image: null,
          createdAt: now,
          updatedAt: now,
          approved: false,
          role: "CUSTOMER",
          priceMultiplier: 1,
        },
      })

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        image: "roses.jpg",
        price: "49.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: [],
      }

      await expect(createProductAction(data)).rejects.toThrow("Unauthorized")
    })

    it("should create product with valid data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.create).mockResolvedValueOnce(mockProduct)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        image: "roses.jpg",
        price: "49.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: [],
      }

      const result = await createProductAction(data)

      expect(result.success).toBe(true)
      expect(result.id).toBe("product-1")
      expect(db.product.create).toHaveBeenCalledWith({
        data: {
          name: "Roses",
          slug: "roses",
          description: "Red roses",
          image: "roses.jpg",
          price: 49.99,
          colors: ["red"],
          productType: "FLOWER",
          featured: false,
          productCollections: {
            create: [],
          },
        },
      })
    })

    it("should create product with collection associations", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.create).mockResolvedValueOnce(mockProduct)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        image: "roses.jpg",
        price: "49.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: ["collection-1", "collection-2"],
      }

      const result = await createProductAction(data)

      expect(result.success).toBe(true)
      expect(db.product.create).toHaveBeenCalledWith({
        data: {
          name: "Roses",
          slug: "roses",
          description: "Red roses",
          image: "roses.jpg",
          price: 49.99,
          colors: ["red"],
          productType: "FLOWER",
          featured: false,
          productCollections: {
            create: [{ collectionId: "collection-1" }, { collectionId: "collection-2" }],
          },
        },
      })
    })
  })

  describe("updateProductAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Updated",
        slug: "updated",
        description: "Updated description",
        image: "image.jpg",
        price: "59.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: [],
      }

      await expect(updateProductAction("product-1", data)).rejects.toThrow("Unauthorized")
    })

    it("should update product", async () => {
      const updatedProduct = { ...mockProduct, name: "Tulips", slug: "tulips" }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(updatedProduct)

      const data = {
        name: "Tulips",
        slug: "tulips",
        description: "Beautiful red roses",
        image: "roses.jpg",
        price: "49.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: [],
      }

      const result = await updateProductAction("product-1", data)

      expect(result.success).toBe(true)
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "product-1" },
        data: {
          name: "Tulips",
          slug: "tulips",
          description: "Beautiful red roses",
          image: "roses.jpg",
          price: 49.99,
          colors: ["red"],
          productType: "FLOWER",
          featured: false,
          productCollections: {
            create: [],
            deleteMany: {},
          },
        },
      })
    })

    it("should update product collections if provided", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(mockProduct)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        image: "roses.jpg",
        price: "49.99",
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        collectionIds: ["collection-1"],
      }

      await updateProductAction("product-1", data)

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "product-1" },
        data: {
          name: "Roses",
          slug: "roses",
          description: "Red roses",
          image: "roses.jpg",
          price: 49.99,
          colors: ["red"],
          productType: "FLOWER",
          featured: false,
          productCollections: {
            deleteMany: {},
            create: [{ collectionId: "collection-1" }],
          },
        },
      })
    })
  })

  describe("deleteProductAction", () => {
    it("should throw error if user not admin", async () => {
      const now = new Date()
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-1",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-1",
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
        user: {
          id: "user-1",
          email: "user@example.com",
          emailVerified: false,
          name: "User",
          image: null,
          createdAt: now,
          updatedAt: now,
          approved: false,
          role: "CUSTOMER",
          priceMultiplier: 1,
        },
      })

      await expect(deleteProductAction("product-1")).rejects.toThrow("Unauthorized")
    })

    it("should delete product", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.delete).mockResolvedValueOnce(mockProduct)

      const result = await deleteProductAction("product-1")

      expect(result.success).toBe(true)
      expect(db.product.delete).toHaveBeenCalledWith({
        where: { id: "product-1" },
      })
    })
  })

  describe("toggleProductFeaturedAction", () => {
    it("should toggle product featured status", async () => {
      const featuredProduct = { ...mockProduct, featured: true }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(featuredProduct)

      const result = await toggleProductFeaturedAction("product-1", true)

      expect(result.success).toBe(true)
      expect(result.featured).toBe(true)
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "product-1" },
        data: { featured: true },
      })
    })

    it("should throw error if user not admin", async () => {
      const now = new Date()
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-1",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-1",
          ipAddress: "127.0.0.1",
          userAgent: "test",
        },
        user: {
          id: "user-1",
          email: "user@example.com",
          emailVerified: false,
          name: "User",
          image: null,
          createdAt: now,
          updatedAt: now,
          approved: false,
          role: "CUSTOMER",
          priceMultiplier: 1,
        },
      })

      await expect(toggleProductFeaturedAction("product-1", true)).rejects.toThrow("Unauthorized")
    })
  })

  describe("getProductCountAction", () => {
    it("should return product count with no filters", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(25)

      const result = await getProductCountAction()

      expect(result).toBe(25)
      expect(db.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      })
    })

    it.skip("should filter by boxlot only", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(5)

      const result = await getProductCountAction({ boxlotOnly: true })

      expect(result).toBe(5)
      expect(db.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null, productType: "BOXLOT" },
      })
    })

    it("should filter by search query", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(3)

      const result = await getProductCountAction({ query: "rose" })

      expect(result).toBe(3)
      expect(db.product.count).toHaveBeenCalled()
    })

    it("should filter by both boxlot and query", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)

      const result = await getProductCountAction({ boxlotOnly: true, query: "rose" })

      expect(result).toBe(1)
      expect(db.product.count).toHaveBeenCalled()
    })
  })
})
