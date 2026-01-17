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
      role: "ADMIN" as const,
      priceMultiplier: 1.0,
    },
  }

  const mockUserSession = {
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
      role: "CUSTOMER" as const,
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
    createdAt: now,
    updatedAt: now,
    _count: {
      productCollections: 0,
    },
  }

  describe("createCollectionAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      const result = await createCollectionAction(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if user not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)

      const data = {
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      const result = await createCollectionAction(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
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
      expect(result.success).toBe(true)
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

    it("should return error on database failure", async () => {
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

      const result = await createCollectionAction(data)
      expect(result.success).toBe(false)
    })
  })

  describe("updateCollectionAction", () => {
    it("should return error if user not authenticated", async () => {
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

      const result = await updateCollectionAction(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if user not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Updated",
        slug: "updated",
        image: "updated.jpg",
        description: "Updated",
        featured: true,
        productIds: [],
      }

      const result = await updateCollectionAction(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should update collection with valid data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockResolvedValueOnce(mockCollection)

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Summer Florals",
        slug: "summer-florals",
        image: "summer.jpg",
        description: "Summer collection",
        featured: false,
        productIds: [],
      }

      const result = await updateCollectionAction(data)
      expect(result.success).toBe(true)
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

    it("should return error on database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockRejectedValueOnce(new Error("DB Error"))

      const data = {
        id: "550e8400-e29b-41d4-a716-446655440001",
        name: "Updated",
        slug: "updated",
        image: "updated.jpg",
        description: "Updated",
        featured: true,
        productIds: [],
      }

      const result = await updateCollectionAction(data)
      expect(result.success).toBe(false)
    })
  })

  describe("deleteCollectionAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if user not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)

      const result = await deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should delete collection successfully", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.delete).mockResolvedValueOnce(mockCollection)

      const result = await deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(true)
      expect(db.collection.delete).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
      })
    })

    it("should return error on database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.delete).mockRejectedValueOnce(new Error("Delete failed"))

      const result = await deleteCollectionAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(false)
    })
  })

  describe("toggleCollectionFeaturedAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await toggleCollectionFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if user not admin", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockUserSession)

      const result = await toggleCollectionFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
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
      expect(db.collection.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: { featured: false },
      })
    })

    it("should return error on database failure", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.collection.update).mockRejectedValueOnce(new Error("Toggle failed"))

      const result = await toggleCollectionFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })

      expect(result.success).toBe(false)
    })
  })
})
