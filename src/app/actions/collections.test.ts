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
    id: "550e8400-e29b-41d4-a716-446655440001",
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
        productIds: [],
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
        productIds: [],
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
        productIds: [],
      }

      const result = await createCollectionAction(data)

      expect(result.id).toBeDefined()
      expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440001")
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
        productIds: [
          "550e8400-e29b-41d4-a716-446655440011",
          "550e8400-e29b-41d4-a716-446655440012",
        ],
      }

      const result = await createCollectionAction(data)

      expect(result.id).toBeDefined()
      expect(db.collection.create).toHaveBeenCalledWith({
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            create: [
              { productId: "550e8400-e29b-41d4-a716-446655440011" },
              { productId: "550e8400-e29b-41d4-a716-446655440012" },
            ],
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

      expect(result.id).toBeDefined()
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

    it("should throw error on database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.create).mockRejectedValueOnce(new Error("DB Error"))

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      await expect(createCollectionAction(data)).rejects.toThrow("DB Error")
    })

    it("should throw error generic error on non-Error exception", async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.collection.create).mockRejectedValueOnce("String error")

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      await expect(createCollectionAction(data)).rejects.toThrow("Failed to create collection")
    })

    it("should throw error on invalid input (ZodError)", async () => {
      const data = {
        name: "", // Invalid: empty name
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      await expect(createCollectionAction(data)).rejects.toThrow("Invalid collection data")
    })
  })

  describe("updateCollectionAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Updated",
        slug: "updated",
        image: "updated.jpg",
        description: "Updated",
        featured: true,
        productIds: [],
      }

      await expect(updateCollectionAction(data)).rejects.toThrow("Unauthorized")
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
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Winter Florals",
        slug: "winter-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      const result = await updateCollectionAction(data)

      expect(result.id).toBeDefined()
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: {
          name: "Winter Florals",
          slug: "winter-florals",
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

    it("should update collection with new products", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [
          "550e8400-e29b-41d4-a716-446655440011",
          "550e8400-e29b-41d4-a716-446655440013",
        ],
      }

      const result = await updateCollectionAction(data)

      expect(result.id).toBeDefined()
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: {
          name: "Summer Florals",
          slug: "summer-florals",
          image: "summer.jpg",
          description: "Summer collection",
          featured: false,
          productCollections: {
            deleteMany: {},
            create: [
              { productId: "550e8400-e29b-41d4-a716-446655440011" },
              { productId: "550e8400-e29b-41d4-a716-446655440013" },
            ],
          },
        },
      })
    })

    it("should update collection without productIds (productIds: undefined)", async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        // productIds is omitted
      }

      await updateCollectionAction(data)

      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
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

  describe("updateCollectionAction - error cases", () => {
    it("should throw error if not admin for update", async () => {
      vi.mocked(getSession).mockResolvedValueOnce({
        session: {
          id: "session-2-update",
          createdAt: now,
          updatedAt: now,
          userId: "user-1",
          expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          token: "token-2-update",
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
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Winter",
        slug: "winter",
        image: "winter.jpg",
        description: "Winter collection",
        featured: false,
        productIds: [],
      }

      await expect(updateCollectionAction(data)).rejects.toThrow("Unauthorized")
    })

    it("should throw error on update database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockRejectedValueOnce(new Error("Update failed"))

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Winter",
        slug: "winter",
        image: "winter.jpg",
        description: "Winter collection",
        featured: false,
        productIds: [],
      }

      await expect(updateCollectionAction(data)).rejects.toThrow("Update failed")
    })

    it("should throw error generic error on non-Error update exception", async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.collection.update).mockRejectedValueOnce("Random error")

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Winter",
        slug: "winter",
        image: "winter.jpg",
        description: "Winter collection",
        featured: false,
        productIds: [],
      }

      await expect(updateCollectionAction(data)).rejects.toThrow("Failed to update collection")
    })

    it("should throw error on invalid update data (ZodError)", async () => {
      const data = {
        id: "invalid-uuid",
        name: "Winter",
        slug: "winter",
        image: "winter.jpg",
        description: "Winter collection",
        featured: false,
        productIds: [],
      }

      await expect(updateCollectionAction(data)).rejects.toThrow("Invalid collection data")
    })
  })

  describe("deleteCollectionAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(
        deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      ).rejects.toThrow("Unauthorized")
    })

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

      await expect(
        deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      ).rejects.toThrow("Unauthorized")
    })

    it("should delete collection", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.delete).mockResolvedValueOnce(mockCollection)

      const result = await deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })

      expect(result.success).toBe(true)
      expect(db.collection.delete).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
      })
    })

    it("should throw error on delete database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.delete).mockRejectedValueOnce(new Error("Delete failed"))

      await expect(
        deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      ).rejects.toThrow("Delete failed")
    })

    it("should throw error generic error on non-Error delete exception", async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.collection.delete).mockRejectedValueOnce("Unknown error")

      await expect(
        deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      ).rejects.toThrow("Failed to delete collection")
    })

    it("should throw error on invalid delete ID (ZodError)", async () => {
      await expect(deleteCollectionAction({ id: "invalid-uuid" })).rejects.toThrow(
        "Invalid collection data"
      )
    })
  })

  describe("toggleCollectionFeaturedAction", () => {
    it("should throw error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      await expect(
        toggleCollectionFeaturedAction({
          id: "550e8400-e29b-41d4-a716-446655440001",
          featured: true,
        })
      ).rejects.toThrow("Unauthorized")
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

      await expect(
        toggleCollectionFeaturedAction({
          id: "550e8400-e29b-41d4-a716-446655440001",
          featured: true,
        })
      ).rejects.toThrow("Unauthorized")
    })

    it("should toggle collection featured status to true", async () => {
      const featuredCollection = { ...mockCollection, featured: true }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(featuredCollection)

      const result = await toggleCollectionFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })

      expect(result.success).toBe(true)
      expect(result.featured).toBe(true)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: { featured: true },
      })
    })

    it("should toggle collection featured status to false", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const result = await toggleCollectionFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: false,
      })

      expect(result.success).toBe(true)
      expect(result.featured).toBe(false)
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: { featured: false },
      })
    })

    it("should throw error on toggle database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockRejectedValueOnce(new Error("Toggle failed"))

      await expect(
        toggleCollectionFeaturedAction({
          id: "550e8400-e29b-41d4-a716-446655440001",
          featured: true,
        })
      ).rejects.toThrow("Toggle failed")
    })

    it("should throw error generic error on non-Error toggle exception", async () => {
      vi.mocked(getSession).mockResolvedValue(mockAdminSession)
      vi.mocked(db.collection.update).mockRejectedValueOnce("Unknown toggle error")

      await expect(
        toggleCollectionFeaturedAction({
          id: "550e8400-e29b-41d4-a716-446655440001",
          featured: true,
        })
      ).rejects.toThrow("Failed to update collection")
    })

    it("should throw error on invalid toggle data (ZodError)", async () => {
      await expect(
        toggleCollectionFeaturedAction({
          id: "invalid-uuid",
          featured: "not-a-boolean" as never,
        })
      ).rejects.toThrow("Invalid collection data")
    })
  })
})
