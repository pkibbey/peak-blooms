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

import { ProductType } from "@/generated/enums"
import type { CollectionModel } from "@/generated/models"
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
    vi.resetAllMocks()
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
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Roses",
    slug: "roses",
    description: "Beautiful red roses",
    images: ["roses.jpg"],
    price: 49.99,
    colors: ["red"],
    productType: ProductType.FLOWER,
    featured: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  describe("createProductAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        images: ["roses.jpg"],
        price: "49.99",
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: [],
      }

      const result = await createProductAction(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should return error if user is not admin", async () => {
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
        images: ["roses.jpg"],
        price: "49.99",
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: [],
      }

      const result = await createProductAction(data)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should create product with valid data", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.create).mockResolvedValueOnce(mockProduct)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        images: ["roses.jpg"],
        price: "49.99",
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: [],
      }

      const result = await createProductAction(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe("550e8400-e29b-41d4-a716-446655440001")
      }
      expect(db.product.create).toHaveBeenCalledWith({
        data: {
          name: "Roses",
          slug: "roses",
          description: "Red roses",
          images: ["roses.jpg"],
          price: 49.99,
          colors: ["red"],
          productType: ProductType.FLOWER,
          featured: false,
          productCollections: {
            create: [],
          },
        },
      })
    })

    it("should handle non-Error exception during create", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.create).mockRejectedValueOnce("String error")

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        images: ["roses.jpg"],
        price: "49.99",
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: [],
      }

      const result = await createProductAction(data)
      expect(result.success).toBe(false)
    })

    it("should create product with collection associations", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.create).mockResolvedValueOnce(mockProduct)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        images: ["roses.jpg"],
        price: "49.99",
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: ["collection-1", "collection-2"],
      }

      const result = await createProductAction(data)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe("550e8400-e29b-41d4-a716-446655440001")
      }
      expect(db.product.create).toHaveBeenCalledWith({
        data: {
          name: "Roses",
          slug: "roses",
          description: "Red roses",
          images: ["roses.jpg"],
          price: 49.99,
          colors: ["red"],
          productType: ProductType.FLOWER,
          featured: false,
          productCollections: {
            create: [{ collectionId: "collection-1" }, { collectionId: "collection-2" }],
          },
        },
      })
    })
  })

  describe("updateProductAction", () => {
    it("should return error if user not authenticated", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const data = {
        name: "Updated",
        slug: "updated",
        description: "Updated description",
        images: ["image.jpg"],
        price: 59.99,
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: [],
      }

      const result = await updateProductAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        ...data,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should update product", async () => {
      const updatedProduct = { ...mockProduct, name: "Tulips", slug: "tulips" }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(updatedProduct)

      const data = {
        name: "Tulips",
        slug: "tulips",
        description: "Beautiful red roses",
        images: ["roses.jpg"],
        price: 49.99,
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: [],
      }

      const result = await updateProductAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        ...data,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBeDefined()
      }
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: {
          name: "Tulips",
          slug: "tulips",
          description: "Beautiful red roses",
          images: ["roses.jpg"],
          price: 49.99,
          colors: ["red"],
          productType: ProductType.FLOWER,
          featured: false,
          productCollections: {
            create: [],
            deleteMany: {},
          },
        },
      })
    })

    it("should handle update without collection changes", async () => {
      const updatedProduct = { ...mockProduct, name: "Tulips" }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(updatedProduct)

      const data = {
        name: "Tulips",
        slug: "tulips",
        description: "Beautiful red roses",
        images: ["roses.jpg"],
        price: 49.99,
        colors: ["red"],
        collectionIds: ["collection-1"],
        productType: ProductType.FLOWER,
        featured: false,
      }

      const result = await updateProductAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        ...data,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe("550e8400-e29b-41d4-a716-446655440001")
      }
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: {
          name: "Tulips",
          slug: "tulips",
          description: "Beautiful red roses",
          images: ["roses.jpg"],
          price: 49.99,
          colors: ["red"],
          productType: ProductType.FLOWER,
          featured: false,
          productCollections: {
            create: [
              {
                collectionId: "collection-1",
              },
            ],
            deleteMany: {},
          },
        },
      })
    })

    it("should handle non-Error exception during update", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockRejectedValueOnce("String error")

      const data = {
        name: "Tulips",
        slug: "tulips",
        description: "Beautiful red roses",
        images: ["roses.jpg"],
        price: 49.99,
        colors: ["red"],
        collectionIds: ["collection-1"],
        productType: ProductType.FLOWER,
        featured: false,
      }

      const result = await updateProductAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        ...data,
      })
      expect(result.success).toBe(false)
    })

    it("should update product collections if provided", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(mockProduct)

      const data = {
        name: "Roses",
        slug: "roses",
        description: "Red roses",
        images: ["roses.jpg"],
        price: 49.99,
        colors: ["red"],
        productType: ProductType.FLOWER,
        featured: false,
        collectionIds: ["collection-1"],
      }

      const result = await updateProductAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        ...data,
      })
      expect(result.success).toBe(true)

      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: {
          name: "Roses",
          slug: "roses",
          description: "Red roses",
          images: ["roses.jpg"],
          price: 49.99,
          colors: ["red"],
          productType: ProductType.FLOWER,
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
    it("should return error if user not admin", async () => {
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

      const result = await deleteProductAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should delete product", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.delete).mockResolvedValueOnce(mockProduct)

      const result = await deleteProductAction({ id: "550e8400-e29b-41d4-a716-446655440001" })

      expect(result.success).toBe(true)
      expect(db.product.delete).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
      })
    })

    it("should return error if user not authenticated for delete", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(null)

      const result = await deleteProductAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should handle non-Error exception during delete", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.delete).mockRejectedValueOnce("String error")

      const result = await deleteProductAction({ id: "550e8400-e29b-41d4-a716-446655440001" })
      expect(result.success).toBe(false)
    })
  })

  describe("toggleProductFeaturedAction", () => {
    it("should toggle product featured status", async () => {
      const featuredProduct = { ...mockProduct, featured: true }

      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockResolvedValueOnce(featuredProduct)

      const result = await toggleProductFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.featured).toBe(true)
      }
      expect(db.product.update).toHaveBeenCalledWith({
        where: { id: "550e8400-e29b-41d4-a716-446655440001" },
        data: { featured: true },
      })
    })

    it("should return error if user not admin", async () => {
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

      const result = await toggleProductFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("UNAUTHORIZED")
      }
    })

    it("should handle non-Error exception during toggle", async () => {
      vi.mocked(getSession).mockResolvedValueOnce(mockAdminSession)
      vi.mocked(db.product.update).mockRejectedValueOnce("String error")

      const result = await toggleProductFeaturedAction({
        id: "550e8400-e29b-41d4-a716-446655440001",
        featured: true,
      })
      expect(result.success).toBe(false)
    })
  })

  describe("getProductCountAction", () => {
    it("should return product count with no filters", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(25)

      const result = await getProductCountAction()

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(25)
      }
      expect(db.product.count).toHaveBeenCalledWith({
        where: { deletedAt: null },
      })
    })

    it("should filter by collection slug (roses)", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(5)
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([
        { id: "collection-roses" } as CollectionModel,
      ])

      const result = await getProductCountAction({ collection: "roses" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(5)
      }
      expect(db.product.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          productCollections: { some: { collectionId: { in: ["collection-roses"] } } },
        },
      })
    })

    it("should filter by search query", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(3)

      const result = await getProductCountAction({ query: "rose" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(3)
      }
      expect(db.product.count).toHaveBeenCalled()
    })

    it("should filter by both collection slug and query", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([
        { id: "collection-roses" } as CollectionModel,
      ])

      const result = await getProductCountAction({ collection: "roses", query: "rose" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(1)
      }
      expect(db.product.count).toHaveBeenCalled()
    })

    it("should handle non-Error exception during count", async () => {
      vi.mocked(db.product.count).mockRejectedValueOnce("String error")

      const result = await getProductCountAction()
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe("SERVER_ERROR")
        expect(result.error).toBe("String error")
      }
    })
  })
})
