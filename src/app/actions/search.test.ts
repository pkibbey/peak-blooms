import { beforeEach, describe, expect, it, vi } from "vitest"
import { Role } from "@/generated/enums"

// Mock dependencies - must be before imports
vi.mock("@/lib/current-user", () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock("@/lib/data", () => ({
  getProducts: vi.fn(),
}))

import { getCurrentUser } from "@/lib/current-user"
import { getProducts } from "@/lib/data"
import { searchProducts } from "./search"

describe("Search Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const now = new Date()
  const mockUser = {
    id: "user-1",
    email: "user@example.com",
    emailVerified: true,
    name: "Test User",
    image: null,
    createdAt: now,
    updatedAt: now,
    approved: true,
    role: Role.CUSTOMER,
    priceMultiplier: 1.5,
  }

  const mockProducts = {
    products: [
      {
        id: "prod-1",
        name: "Red Roses",
        slug: "red-roses",
        description: "Beautiful red roses",
        image: "roses.jpg",
        price: 50,
        colors: ["red"],
        productType: "FLOWER" as const,
        featured: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        productCollections: [],
      },
      {
        id: "prod-2",
        name: "White Roses",
        slug: "white-roses",
        description: "Beautiful white roses",
        image: "white-roses.jpg",
        price: 55,
        colors: ["white"],
        productType: "FLOWER" as const,
        featured: false,
        deletedAt: null,
        createdAt: now,
        updatedAt: now,
        productCollections: [],
      },
    ],
    total: 2,
    limit: 10,
    offset: 0,
  }

  describe("searchProducts", () => {
    it("should return VALIDATION_ERROR for empty search term", async () => {
      const result = await searchProducts({ searchTerm: "" })

      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
        error: "searchTerm: Search term is required",
      })
      expect(getProducts).not.toHaveBeenCalled()
    })

    it("should return empty results for whitespace-only search term", async () => {
      const result = await searchProducts({ searchTerm: "     " })

      expect(result).toEqual({ success: true, data: { products: [] } })
      expect(getProducts).not.toHaveBeenCalled()
    })

    it("should search products with default multiplier (1.0) for unauthenticated users", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      vi.mocked(getProducts).mockResolvedValueOnce(mockProducts)

      const result = await searchProducts({ searchTerm: "roses" })

      expect(result).toEqual({
        success: true,
        data: {
          products: [
            {
              id: "prod-1",
              name: "Red Roses",
              slug: "red-roses",
              image: "roses.jpg",
              price: 50,
            },
            {
              id: "prod-2",
              name: "White Roses",
              slug: "white-roses",
              image: "white-roses.jpg",
              price: 55,
            },
          ],
        },
      })
      expect(getProducts).toHaveBeenCalledWith(
        {
          search: "roses",
          limit: 10,
        },
        1.0
      )
    })

    it("should apply user's price multiplier to search results", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser)
      vi.mocked(getProducts).mockResolvedValueOnce(mockProducts)

      const result = await searchProducts({ searchTerm: "roses" })

      expect(result).toEqual({
        success: true,
        data: {
          products: [
            {
              id: "prod-1",
              name: "Red Roses",
              slug: "red-roses",
              image: "roses.jpg",
              price: 50,
            },
            {
              id: "prod-2",
              name: "White Roses",
              slug: "white-roses",
              image: "white-roses.jpg",
              price: 55,
            },
          ],
        },
      })
      expect(getProducts).toHaveBeenCalledWith(
        {
          search: "roses",
          limit: 10,
        },
        1.5
      )
    })

    it("should trim search term before querying", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      vi.mocked(getProducts).mockResolvedValueOnce({
        products: [],
        total: 0,
        limit: 10,
        offset: 0,
      })

      await searchProducts({ searchTerm: "  roses  " })

      expect(getProducts).toHaveBeenCalledWith(
        {
          search: "roses",
          limit: 10,
        },
        1.0
      )
    })

    it("should handle zero results gracefully", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      vi.mocked(getProducts).mockResolvedValueOnce({
        products: [],
        total: 0,
        limit: 10,
        offset: 0,
      })

      const result = await searchProducts({ searchTerm: "nonexistent" })

      expect(result).toEqual({ success: true, data: { products: [] } })
    })

    it("should return SERVER_ERROR on auth error", async () => {
      vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Auth error"))

      const result = await searchProducts({ searchTerm: "roses" })

      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Auth error",
      })
    })

    it("should return SERVER_ERROR if getProducts fails", async () => {
      vi.mocked(getCurrentUser).mockResolvedValueOnce(null)
      vi.mocked(getProducts).mockRejectedValueOnce(new Error("Database error"))

      const result = await searchProducts({ searchTerm: "roses" })

      expect(result).toMatchObject({
        success: false,
        code: "SERVER_ERROR",
        error: "Database error",
      })
    })

    it("should return VALIDATION_ERROR on invalid input", async () => {
      const result = await searchProducts({} as never)
      expect(result).toMatchObject({
        success: false,
        code: "VALIDATION_ERROR",
      })
    })
  })
})
