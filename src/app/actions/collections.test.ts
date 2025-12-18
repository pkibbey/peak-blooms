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
  createCollectionAction,
  deleteCollectionAction,
  toggleCollectionFeaturedAction,
  updateCollectionAction,
} from "./collections"

describe("Collection Actions", () => {
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
    },
    user: {
      id: "admin-1",
      createdAt: now,
      updatedAt: now,
      email: "admin@example.com",
      emailVerified: true,
      name: "Admin User",
      image: null,
      approved: true,
      role: "ADMIN",
      priceMultiplier: 1.0,
    },
  }

  const mockCollection = {
    id: "collection-1",
    name: "Summer Florals",
    slug: "summer-florals",
    image: "summer.jpg",
    description: "Summer collection",
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  describe("createCollectionAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
      }

      await expect(createCollectionAction(data)).rejects.toThrow("Unauthorized")
    })

    it("should throw error if user is not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-2",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-2",
        },
        user: {
          id: "user-1",
          createdAt: now,
          updatedAt: now,
          email: "user@example.com",
          emailVerified: true,
          name: "Customer User",
          image: null,
          approved: true,
          role: "CUSTOMER",
          priceMultiplier: 1.0,
        },
      })

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
      }

      await expect(createCollectionAction(data)).rejects.toThrow("Unauthorized")
    })

    it("should create collection with valid data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.create).mockResolvedValueOnce(mockCollection)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
      }

      const result = await createCollectionAction(data)

      expect(result.success).toBe(true)
      expect(result.id).toBe("collection-1")
      expect(db.collection.create).toHaveBeenCalledWith({
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            create: [],
          },
        },
      })
    })

    it("should create collection with product associations", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.create).mockResolvedValueOnce(mockCollection)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: ["product-1", "product-2"],
      }

      const result = await createCollectionAction(data)

      expect(result.success).toBe(true)
      expect(db.collection.create).toHaveBeenCalledWith({
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            create: [{ productId: "product-1" }, { productId: "product-2" }],
          },
        },
      })
    })

    it("should handle empty product list", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.create).mockResolvedValueOnce(mockCollection)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      const result = await createCollectionAction(data)

      expect(result.success).toBe(true)
      expect(db.collection.create).toHaveBeenCalledWith({
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            create: [],
          },
        },
      })
    })
  })

  describe("updateCollectionAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Updated",
        slug: "updated",
        image: "updated.jpg",
        description: "Updated",
        featured: true,
      }

      await expect(updateCollectionAction("collection-1", data)).rejects.toThrow("Unauthorized")
    })

    it("should update collection without changing products", async () => {
      const updatedCollection = {
        ...mockCollection,
        name: "Winter Florals",
        slug: "winter-florals",
      }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(updatedCollection)

      const data = {
        name: "Winter Florals",
        slug: "winter-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
      }

      const result = await updateCollectionAction("collection-1", data)

      expect(result.success).toBe(true)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "collection-1" },
        data: {
          name: "Winter Florals",
          slug: "winter-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: undefined,
        },
      })
    })

    it("should update collection with new products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: ["product-1", "product-3"],
      }

      const result = await updateCollectionAction("collection-1", data)

      expect(result.success).toBe(true)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "collection-1" },
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            deleteMany: {},
            create: [{ productId: "product-1" }, { productId: "product-3" }],
          },
        },
      })
    })

    it("should clear products when productIds is empty array", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      const result = await updateCollectionAction("collection-1", data)

      expect(result.success).toBe(true)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "collection-1" },
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            deleteMany: {},
            create: [],
          },
        },
      })
    })
  })

  describe("deleteCollectionAction", () => {
    it("should throw error if user not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-3",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-3",
        },
        user: {
          id: "user-1",
          createdAt: now,
          updatedAt: now,
          email: "user@example.com",
          emailVerified: true,
          name: "Customer User",
          image: null,
          approved: true,
          role: "CUSTOMER",
          priceMultiplier: 1.0,
        },
      })

      await expect(deleteCollectionAction("collection-1")).rejects.toThrow("Unauthorized")
    })

    it("should delete collection", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.delete).mockResolvedValueOnce(mockCollection)

      const result = await deleteCollectionAction("collection-1")

      expect(result.success).toBe(true)
      expect(db.collection.delete).toHaveBeenCalledWith({
        where: { id: "collection-1" },
      })
    })
  })

  describe("toggleCollectionFeaturedAction", () => {
    it("should toggle collection featured status to true", async () => {
      const featuredCollection = { ...mockCollection, featured: true }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(featuredCollection)

      const result = await toggleCollectionFeaturedAction("collection-1", true)

      expect(result.success).toBe(true)
      expect(result.featured).toBe(true)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "collection-1" },
        data: { featured: true },
      })
    })

    it("should toggle collection featured status to false", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const result = await toggleCollectionFeaturedAction("collection-1", false)

      expect(result.success).toBe(true)
      expect(result.featured).toBe(false)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "collection-1" },
        data: { featured: false },
      })
    })

    it("should throw error if user not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-4",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-4",
        },
        user: {
          id: "user-1",
          createdAt: now,
          updatedAt: now,
          email: "user@example.com",
          emailVerified: true,
          name: "Customer User",
          image: null,
          approved: true,
          role: "CUSTOMER",
          priceMultiplier: 1.0,
        },
      })

      await expect(toggleCollectionFeaturedAction("collection-1", true)).rejects.toThrow(
        "Unauthorized"
      )
    })
  })
})
