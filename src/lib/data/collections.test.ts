import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProductType } from "@/generated/enums"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/utils", () => ({
  adjustPrice: vi.fn((price: number, multiplier: number) => price * multiplier),
}))

vi.mock("./logger", () => ({
  withTiming: vi.fn(
    async <T>(_name: string, _input: Record<string, unknown>, fn: () => Promise<T>) => fn()
  ),
}))

import { db } from "@/lib/db"
import { getAllCollections, getCollectionBySlug, getFeaturedCollections } from "./collections"

describe("Collections Data Access Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockCollection = {
    id: "coll-1",
    name: "Romantic",
    slug: "romantic",
    description: "Romantic arrangements",
    image: "romantic.jpg",
    featured: true,
    createdAt: now,
    updatedAt: now,
    _count: {
      productCollections: 5,
    },
  }

  const mockProduct = {
    id: "prod-1",
    name: "Red Roses",
    slug: "red-roses",
    description: "Beautiful red roses",
    image: "roses.jpg",
    price: 50,
    colors: ["red"],
    productType: ProductType.FLOWER,
    featured: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const mockCollectionWithProducts = {
    ...mockCollection,
    productCollections: [
      {
        productId: "prod-1",
        collectionId: "coll-1",
        createdAt: now,
        product: mockProduct,
      },
    ],
  }

  describe("getAllCollections", () => {
    it("should return all collections ordered by name", async () => {
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([mockCollection])

      const result = await getAllCollections()

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockCollection)
      expect(db.collection.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
        include: { _count: { select: { productCollections: true } } },
      })
    })

    it("should return empty array if no collections", async () => {
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([])

      const result = await getAllCollections()

      expect(result).toHaveLength(0)
    })

    it("should include product count for each collection", async () => {
      const collectionWithCount = {
        ...mockCollection,
        _count: { productCollections: 5 },
      }

      vi.mocked(db.collection.findMany).mockResolvedValueOnce([collectionWithCount])

      const result = await getAllCollections()

      expect(result[0]._count.productCollections).toBe(5)
    })
  })

  describe("getFeaturedCollections", () => {
    it("should return only featured collections", async () => {
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([mockCollection])

      const result = await getFeaturedCollections()

      expect(result).toHaveLength(1)
      expect(result[0].featured).toBe(true)
      expect(db.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { featured: true },
        })
      )
    })

    it("should order featured collections by name", async () => {
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([mockCollection])

      await getFeaturedCollections()

      expect(db.collection.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      )
    })

    it("should return empty array if no featured collections", async () => {
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([])

      const result = await getFeaturedCollections()

      expect(result).toHaveLength(0)
    })
  })

  describe("getCollectionBySlug", () => {
    it("should return null if collection not found", async () => {
      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(null)

      const result = await getCollectionBySlug("nonexistent", 1.0)

      expect(result).toBeNull()
    })

    it("should return collection with products", async () => {
      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(mockCollectionWithProducts)

      const result = await getCollectionBySlug("romantic", 1.0)

      expect(result).not.toBeNull()
      expect(result?.productCollections).toHaveLength(1)
      expect(result?.productCollections[0].product.name).toBe("Red Roses")
    })

    it("should apply price multiplier to products", async () => {
      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(mockCollectionWithProducts)

      const result = await getCollectionBySlug("romantic", 1.5)

      expect(result?.productCollections[0].product.price).toBe(75) // 50 * 1.5
    })

    it("should exclude soft-deleted products", async () => {
      const collectionWithDeletedProduct = {
        ...mockCollectionWithProducts,
        productCollections: [
          {
            productId: "prod-1",
            collectionId: "coll-1",
            createdAt: now,
            product: { ...mockProduct, deletedAt: new Date() },
          },
        ],
      }

      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(collectionWithDeletedProduct)

      const result = await getCollectionBySlug("romantic", 1.0)

      expect(result?.productCollections).toHaveLength(0)
    })

    it("should order products by creation date descending", async () => {
      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(mockCollectionWithProducts)

      await getCollectionBySlug("romantic", 1.0)

      expect(db.collection.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            productCollections: {
              orderBy: { createdAt: "desc" },
              include: { product: true },
            },
          },
        })
      )
    })

    it("should handle empty product collections", async () => {
      const emptyCollection = {
        ...mockCollectionWithProducts,
        productCollections: [],
      }

      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(emptyCollection)

      const result = await getCollectionBySlug("empty", 1.0)

      expect(result?.productCollections).toHaveLength(0)
    })

    it("should filter out multiple soft-deleted products", async () => {
      const multipleProducts = {
        ...mockCollectionWithProducts,
        productCollections: [
          {
            productId: "prod-1",
            collectionId: "coll-1",
            createdAt: now,
            product: mockProduct,
          },
          {
            productId: "prod-2",
            collectionId: "coll-1",
            createdAt: now,
            product: { ...mockProduct, id: "prod-2", deletedAt: new Date() },
          },
          {
            productId: "prod-3",
            collectionId: "coll-1",
            createdAt: now,
            product: { ...mockProduct, id: "prod-3" },
          },
        ],
      }

      vi.mocked(db.collection.findUnique).mockResolvedValueOnce(multipleProducts)

      const result = await getCollectionBySlug("romantic", 1.0)

      expect(result?.productCollections).toHaveLength(2)
    })
  })
})
