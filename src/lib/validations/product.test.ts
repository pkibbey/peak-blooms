import { describe, expect, it } from "vitest"
import { ProductType } from "@/generated/enums"
import { productSchema } from "@/lib/validations/product"

describe("productSchema (form validation)", () => {
  const validProduct = {
    name: "Red Roses",
    slug: "red-roses",
    description: "Beautiful red roses",
    image: "https://example.com/roses.jpg",
    price: "49.99",
    colors: ["red", "crimson"],
    collectionIds: ["collection-1", "collection-2"],
    productType: ProductType.ROSE,
    featured: true,
  }

  describe("valid inputs", () => {
    it("should accept valid product", () => {
      const result = productSchema.safeParse(validProduct)
      expect(result.success).toBe(true)
    })

    it("should reject product without colors array", () => {
      const { colors, ...productWithoutColors } = validProduct
      const result = productSchema.safeParse(productWithoutColors)
      expect(result.success).toBe(false)
    })

    it("should accept product with empty colors array", () => {
      const result = productSchema.safeParse({ ...validProduct, colors: [] })
      expect(result.success).toBe(true)
    })

    it("should accept product with valid price formats", () => {
      const validPrices = ["0", "49.99", "1000.00", "0.01"]
      validPrices.forEach((price) => {
        const result = productSchema.safeParse({ ...validProduct, price })
        expect(result.success).toBe(true)
      })
    })

    it("should accept all valid productTypes", () => {
      const types = Object.values(ProductType)
      types.forEach((productType) => {
        const result = productSchema.safeParse({ ...validProduct, productType })
        expect(result.success).toBe(true)
      })
    })

    it("should accept featured as false", () => {
      const result = productSchema.safeParse({ ...validProduct, featured: false })
      expect(result.success).toBe(true)
    })

    it("should accept product with single collection", () => {
      const result = productSchema.safeParse({
        ...validProduct,
        collectionIds: ["collection-1"],
      })
      expect(result.success).toBe(true)
    })

    it("should accept missing price", () => {
      const { price, ...noPrice } = validProduct
      const result = productSchema.safeParse(noPrice)
      expect(result.success).toBe(true)
    })

    it("should accept empty price string", () => {
      const result = productSchema.safeParse({ ...validProduct, price: "" })
      expect(result.success).toBe(true)
    })

    it("should accept empty collectionIds array", () => {
      const result = productSchema.safeParse({ ...validProduct, collectionIds: [] })
      expect(result.success).toBe(true)
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing name", () => {
      const { name, ...noName } = validProduct
      const result = productSchema.safeParse(noName)
      expect(result.success).toBe(false)
    })

    it("should reject empty name", () => {
      const result = productSchema.safeParse({ ...validProduct, name: "" })
      expect(result.success).toBe(false)
    })

    it("should reject missing slug", () => {
      const { slug, ...noSlug } = validProduct
      const result = productSchema.safeParse(noSlug)
      expect(result.success).toBe(false)
    })

    it("should reject negative price", () => {
      const result = productSchema.safeParse({ ...validProduct, price: "-10" })
      expect(result.success).toBe(false)
    })

    it("should reject invalid price format", () => {
      const result = productSchema.safeParse({ ...validProduct, price: "abc" })
      expect(result.success).toBe(false)
    })

    it("should reject missing collectionIds", () => {
      const { collectionIds, ...noCollections } = validProduct
      const result = productSchema.safeParse(noCollections)
      expect(result.success).toBe(false)
    })

    it("should reject invalid productType", () => {
      const result = productSchema.safeParse({
        ...validProduct,
        productType: "INVALID",
      })
      expect(result.success).toBe(false)
    })

    it("should reject non-boolean featured value", () => {
      const result = productSchema.safeParse({
        ...validProduct,
        featured: "yes",
      })
      expect(result.success).toBe(false)
    })
  })
})
