import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProductType } from "@/generated/enums"
import { ITEMS_PER_PAGE } from "@/lib/consts"
import { createMockPrismaClient } from "@/test/mocks"

// Mock dependencies - must be before imports
vi.mock("@/lib/db", () => ({
  db: createMockPrismaClient(),
}))

vi.mock("@/lib/utils", () => ({
  adjustPrice: vi.fn((price: number, multiplier: number) => price * multiplier),
  makeFriendlyOrderId: vi.fn(
    (userId: string, orderId: string) => `${userId}-${String(orderId).slice(-4)}`
  ),
}))

vi.mock("./logger", () => ({
  withTiming: vi.fn(
    async <T>(_name: string, _input: Record<string, unknown>, fn: () => Promise<T>) => fn()
  ),
}))

import type { ProductModel } from "@/generated/models"
import { db } from "@/lib/db"
import {
  getFeaturedProducts,
  getProducts,
  getProductWithInspirations,
  getShopFilterOptions,
} from "./products"

describe("Products Data Access Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockProduct: ProductModel = {
    id: "prod-1",
    name: "Red Roses",
    slug: "red-roses",
    description: "Beautiful red roses",
    images: ["roses.jpg"],
    price: 50,
    colors: ["red"],
    productType: ProductType.FLOWER,
    featured: false,
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const mockProductWithCollections = {
    ...mockProduct,
    productCollections: [
      {
        productId: "prod-1",
        collectionId: "coll-1",
        createdAt: now,
        collection: {
          id: "coll-1",
          name: "Romantic",
          slug: "romantic",
          description: null,
          image: null,
          featured: true,
          createdAt: now,
          updatedAt: now,
        },
      },
    ],
  }

  describe("getProducts", () => {
    it("should return all products without filters", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      const result = await getProducts({}, 1.0)

      expect(result.products).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null },
        })
      )
    })

    it("should apply price multiplier to products", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      const result = await getProducts({}, 1.5)

      expect(result.products[0].price).toBe(75) // 50 * 1.5
    })

    it("should filter by featured products", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([
        { ...mockProductWithCollections, featured: true },
      ])

      await getProducts({ featured: true }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ featured: true }),
        })
      )
    })

    it("should filter by colors", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ colors: ["red", "white"] }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            colors: { hasSome: ["red", "white"] },
          }),
        })
      )
    })

    it("should filter by product types", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ types: [ProductType.FLOWER, ProductType.PLANT] }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productType: { in: [ProductType.FLOWER, ProductType.PLANT] },
          }),
        })
      )
    })

    it("should search by name", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ search: "roses" }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it("should filter by collection IDs", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ collectionIds: ["coll-1"] }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            productCollections: {
              some: {
                collectionId: { in: ["coll-1"] },
              },
            },
          }),
        })
      )
    })

    it("should filter by price range", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ priceMin: 40, priceMax: 100 }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 40, lte: 100 },
          }),
        })
      )
    })

    it("should apply pagination", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(100)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      const result = await getProducts({ limit: 10, offset: 20 }, 1.0)

      expect(result.limit).toBe(10)
      expect(result.offset).toBe(20)
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 20,
        })
      )
    })

    it("should sort by price", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ sort: "price", order: "desc" }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: "desc" },
        })
      )
    })

    it("should exclude soft-deleted products", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({}, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      )
    })

    it("should handle empty results", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(0)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([])

      const result = await getProducts({}, 1.0)

      expect(result.products).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it("should filter by images and description when requested", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ filterImages: "has", filterDescription: "has" }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ description: { not: null } }),
              expect.objectContaining({ description: { not: "" } }),
            ]),
            images: { isEmpty: false },
          }),
        })
      )
    })

    it("should use default limit from ITEMS_PER_PAGE when not specified", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      const result = await getProducts({}, 1.0)

      expect(result.limit).toBe(ITEMS_PER_PAGE)
    })

    it("should ignore invalid sort fields and keep default ordering", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ sort: "notAField" }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      )
    })

    it("should default to asc when sort field provided without order", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([mockProductWithCollections])

      await getProducts({ sort: "name" }, 1.0)

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      )
    })
  })

  describe("getFeaturedProducts", () => {
    it("should return featured products with multiplier and only complete products", async () => {
      vi.mocked(db.product.count).mockResolvedValueOnce(1)
      vi.mocked(db.product.findMany).mockResolvedValueOnce([
        { ...mockProductWithCollections, featured: true },
      ])

      const result = await getFeaturedProducts(2.0, 5)

      expect(result).toHaveLength(1)
      expect(result[0].price).toBe(100) // 50 * 2.0

      // Ensure the DB query included filters for featured + complete products
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            featured: true,
            AND: expect.arrayContaining([
              expect.objectContaining({ description: { not: null } }),
              expect.objectContaining({ description: { not: "" } }),
            ]),
            images: { isEmpty: false },
          }),
        })
      )
    })
  })

  describe("getProductWithInspirations", () => {
    it("should return null if product not found", async () => {
      vi.mocked(db.product.findFirst).mockResolvedValueOnce(null)

      const result = await getProductWithInspirations("nonexistent", 1.0)

      expect(result).toBeNull()
    })

    it("should return product with inspirations and collections", async () => {
      const mockProductWithInspirations = {
        ...mockProductWithCollections,
        inspirations: [
          {
            productId: "prod-1",
            inspirationId: "insp-1",
            quantity: 5,
            inspiration: {
              id: "insp-1",
              name: "Wedding",
              slug: "wedding",
              subtitle: null,
              image: "wedding.jpg",
              excerpt: null,
              text: null,
              createdAt: now,
              updatedAt: now,
              _count: { products: 3 },
            },
          },
        ],
      }

      vi.mocked(db.product.findFirst).mockResolvedValueOnce(mockProductWithInspirations)

      const result = await getProductWithInspirations("red-roses", 1.0)

      expect(result).not.toBeNull()
      expect(result?.inspirations).toHaveLength(1)
    })

    it("should exclude soft-deleted products", async () => {
      vi.mocked(db.product.findFirst).mockResolvedValueOnce(null)

      await getProductWithInspirations("deleted-product", 1.0)

      expect(db.product.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deletedAt: null }),
        })
      )
    })

    it("should apply price multiplier to inspiration products", async () => {
      const mockProductWithInspirations = {
        ...mockProductWithCollections,
        inspirations: [
          {
            productId: "prod-1",
            inspirationId: "insp-1",
            quantity: 5,
            inspiration: {
              id: "insp-1",
              name: "Wedding",
              slug: "wedding",
              subtitle: null,
              image: "wedding.jpg",
              excerpt: null,
              text: null,
              createdAt: now,
              updatedAt: now,
              _count: { products: 3 },
            },
          },
        ],
      }

      vi.mocked(db.product.findFirst).mockResolvedValueOnce(mockProductWithInspirations)

      const result = await getProductWithInspirations("red-roses", 2.0)

      expect(result?.price).toBe(100) // 50 * 2.0
    })
  })

  describe("getShopFilterOptions", () => {
    it("should return color IDs and collections", async () => {
      const mockProducts = [
        { ...mockProduct, colors: ["red", "white"] },
        { ...mockProduct, id: "prod-2", colors: ["white", "pink"] },
        { ...mockProduct, id: "prod-3", colors: ["red"] },
      ]

      vi.mocked(db.product.findMany).mockResolvedValueOnce(mockProducts)
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([
        {
          id: "coll-1",
          name: "Romantic",
          slug: "romantic",
          description: null,
          image: null,
          featured: true,
          createdAt: now,
          updatedAt: now,
        },
      ])

      const result = await getShopFilterOptions()

      expect(result.colorIds).toContain("red")
      expect(result.colorIds).toContain("white")
      expect(result.colorIds).toContain("pink")
      expect(result.collections).toHaveLength(1)

      // Ensure we only gathered colors from visible (complete) products
      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({ description: { not: null } }),
              expect.objectContaining({ description: { not: "" } }),
              expect.objectContaining({ images: { isEmpty: false } }),
            ]),
          }),
        })
      )
    })

    it("should return unique sorted color IDs", async () => {
      const mockProducts = [
        { ...mockProduct, colors: ["blue", "red"] },
        { ...mockProduct, id: "prod-2", colors: ["red", "pink"] },
        { ...mockProduct, id: "prod-3", colors: ["blue", "white"] },
      ]

      vi.mocked(db.product.findMany).mockResolvedValueOnce(mockProducts)
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([])

      const result = await getShopFilterOptions()

      expect(result.colorIds).toEqual(["blue", "pink", "red", "white"].sort())
    })

    it("should only include non-deleted products in color list", async () => {
      vi.mocked(db.product.findMany).mockResolvedValueOnce([])
      vi.mocked(db.collection.findMany).mockResolvedValueOnce([])

      await getShopFilterOptions()

      expect(db.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
            AND: expect.arrayContaining([
              expect.objectContaining({ description: { not: null } }),
              expect.objectContaining({ description: { not: "" } }),
              expect.objectContaining({ images: { isEmpty: false } }),
            ]),
          }),
          select: { colors: true },
        })
      )
    })
  })
})
