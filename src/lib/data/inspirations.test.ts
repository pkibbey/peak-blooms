import { beforeEach, describe, expect, it, vi } from "vitest"
import { ProductType } from "@/generated/enums"
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

import { db } from "@/lib/db"
import { getInspirationBySlug, getInspirationsWithCounts } from "./inspirations"

describe("Inspirations Data Access Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockProduct = {
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

  const mockInspiration = {
    id: "insp-1",
    name: "Wedding Bouquet",
    slug: "wedding-bouquet",
    subtitle: "Perfect for ceremonies",
    image: "wedding.jpg",
    excerpt: "Beautiful wedding arrangements",
    text: "Full description of wedding arrangements",
    createdAt: now,
    updatedAt: now,
  }

  const mockInspirationWithCount = {
    ...mockInspiration,
    _count: {
      products: 3,
    },
  }

  const mockInspirationWithProducts = {
    ...mockInspiration,
    products: [
      {
        productId: "prod-1",
        inspirationId: "insp-1",
        quantity: 5,
        product: mockProduct,
      },
      {
        productId: "prod-2",
        inspirationId: "insp-1",
        quantity: 3,
        product: { ...mockProduct, id: "prod-2", name: "White Roses", price: 55 },
      },
    ],
  }

  describe("getInspirationsWithCounts", () => {
    it("should return all inspirations with product counts", async () => {
      vi.mocked(db.inspiration.findMany).mockResolvedValueOnce([mockInspirationWithCount])

      const result = await getInspirationsWithCounts()

      expect(result).toHaveLength(1)
      expect(result[0]._count.products).toBe(3)
    })

    it("should order inspirations by creation date descending", async () => {
      vi.mocked(db.inspiration.findMany).mockResolvedValueOnce([mockInspirationWithCount])

      await getInspirationsWithCounts()

      expect(db.inspiration.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      )
    })

    it("should return empty array if no inspirations", async () => {
      vi.mocked(db.inspiration.findMany).mockResolvedValueOnce([])

      const result = await getInspirationsWithCounts()

      expect(result).toHaveLength(0)
    })

    it("should include product count for each inspiration", async () => {
      const multipleInspirations = [
        { ...mockInspirationWithCount },
        {
          ...mockInspiration,
          id: "insp-2",
          slug: "birthday-bouquet",
          _count: { products: 5 },
        },
      ]

      vi.mocked(db.inspiration.findMany).mockResolvedValueOnce(multipleInspirations)

      const result = await getInspirationsWithCounts()

      expect(result).toHaveLength(2)
      expect(result[0]._count.products).toBe(3)
      expect(result[1]._count.products).toBe(5)
    })
  })

  describe("getInspirationBySlug", () => {
    it("should return null if inspiration not found", async () => {
      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(null)

      const result = await getInspirationBySlug("nonexistent", 1.0)

      expect(result).toBeNull()
    })

    it("should return inspiration with products", async () => {
      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(mockInspirationWithProducts)

      const result = await getInspirationBySlug("wedding-bouquet", 1.0)

      expect(result).not.toBeNull()
      expect(result?.products).toHaveLength(2)
      expect(result?.products[0].product.name).toBe("Red Roses")
    })

    it("should apply price multiplier to products", async () => {
      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(mockInspirationWithProducts)

      const result = await getInspirationBySlug("wedding-bouquet", 1.5)

      expect(result?.products[0].product.price).toBe(75) // 50 * 1.5
      expect(result?.products[1].product.price).toBe(82.5) // 55 * 1.5
    })

    it("should include product quantities", async () => {
      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(mockInspirationWithProducts)

      const result = await getInspirationBySlug("wedding-bouquet", 1.0)

      expect(result?.products[0].quantity).toBe(5)
      expect(result?.products[1].quantity).toBe(3)
    })

    it("should handle empty product list", async () => {
      const inspirationNoProducts = {
        ...mockInspiration,
        products: [],
      }

      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(inspirationNoProducts)

      const result = await getInspirationBySlug("wedding-bouquet", 1.0)

      expect(result?.products).toHaveLength(0)
    })

    it("should filter out products missing description or images", async () => {
      const inspirationWithIncomplete = {
        ...mockInspiration,
        products: [
          {
            productId: "prod-1",
            inspirationId: "insp-1",
            quantity: 1,
            product: { ...mockProduct, description: null },
          },
          {
            productId: "prod-2",
            inspirationId: "insp-1",
            quantity: 1,
            product: { ...mockProduct, id: "prod-2", images: [] },
          },
        ],
      }

      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(inspirationWithIncomplete)

      const result = await getInspirationBySlug("wedding-bouquet", 1.0)

      expect(result?.products).toHaveLength(0)
    })

    it("should use default multiplier of 1.0", async () => {
      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(mockInspirationWithProducts)

      const result = await getInspirationBySlug("wedding-bouquet")

      expect(result?.products[0].product.price).toBe(50) // No multiplier applied
    })

    it("should include all inspiration fields", async () => {
      vi.mocked(db.inspiration.findUnique).mockResolvedValueOnce(mockInspirationWithProducts)

      const result = await getInspirationBySlug("wedding-bouquet", 1.0)

      expect(result).toMatchObject({
        id: "insp-1",
        name: "Wedding Bouquet",
        slug: "wedding-bouquet",
        subtitle: "Perfect for ceremonies",
        image: "wedding.jpg",
        excerpt: "Beautiful wedding arrangements",
        text: "Full description of wedding arrangements",
      })
    })
  })
})
