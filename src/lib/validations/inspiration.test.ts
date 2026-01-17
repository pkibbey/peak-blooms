import { describe, expect, it } from "vitest"
import { createInspirationSchema, type ProductSelection } from "@/lib/validations/inspiration"

describe("createInspirationSchema", () => {
  const validInspiration = {
    name: "Summer Garden",
    slug: "summer-garden",
    subtitle: "Fresh flowers for the season",
    image: "https://example.com/summer.jpg",
    excerpt: "Beautiful summer arrangement",
    text: "This stunning arrangement features the best of summer blooms...",
    productSelections: [
      {
        productId: "product-1",
        quantity: 3,
      },
      {
        productId: "product-2",
        quantity: 2,
      },
    ],
  }

  describe("valid inputs", () => {
    it("should accept valid inspiration with all fields", () => {
      const result = createInspirationSchema.safeParse(validInspiration)
      expect(result.success).toBe(true)
    })

    it("should accept inspiration with single product selection", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
            quantity: 5,
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it("should accept inspiration with multiple product selections", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          { productId: "product-1", quantity: 2 },
          { productId: "product-2", quantity: 3 },
          { productId: "product-3", quantity: 1 },
        ],
      })
      expect(result.success).toBe(true)
    })

    it("should accept product selection with quantity 1", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
            quantity: 1,
          },
        ],
      })
      expect(result.success).toBe(true)
    })

    it("should accept product selection with large quantity", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
            quantity: 100,
          },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing name", () => {
      const { name, ...noName } = validInspiration
      const result = createInspirationSchema.safeParse(noName)
      expect(result.success).toBe(false)
    })

    it("should reject empty name", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        name: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing slug", () => {
      const { slug, ...noSlug } = validInspiration
      const result = createInspirationSchema.safeParse(noSlug)
      expect(result.success).toBe(false)
    })

    it("should reject empty slug", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        slug: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing subtitle", () => {
      const { subtitle, ...noSubtitle } = validInspiration
      const result = createInspirationSchema.safeParse(noSubtitle)
      expect(result.success).toBe(false)
    })

    it("should reject empty subtitle", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        subtitle: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing image", () => {
      const { image, ...noImage } = validInspiration
      const result = createInspirationSchema.safeParse(noImage)
      expect(result.success).toBe(false)
    })

    it("should reject empty image", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        image: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing excerpt", () => {
      const { excerpt, ...noExcerpt } = validInspiration
      const result = createInspirationSchema.safeParse(noExcerpt)
      expect(result.success).toBe(false)
    })

    it("should reject empty excerpt", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        excerpt: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing text (inspiration text)", () => {
      const { text, ...noText } = validInspiration
      const result = createInspirationSchema.safeParse(noText)
      expect(result.success).toBe(false)
    })

    it("should reject empty text", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        text: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing productSelections array", () => {
      const { productSelections, ...noProducts } = validInspiration
      const result = createInspirationSchema.safeParse(noProducts)
      expect(result.success).toBe(false)
    })

    it("should reject product selection without productId", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            quantity: 3,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("should reject product selection with empty productId", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "",
            quantity: 3,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("should reject product selection without quantity", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("should reject product selection with zero quantity", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
            quantity: 0,
          },
        ],
      })
      expect(result.success).toBe(false)
    })

    it("should reject product selection with negative quantity", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
            quantity: -5,
          },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe("ProductSelection type", () => {
    it("should correctly infer ProductSelection type", () => {
      const selection: ProductSelection = {
        productId: "product-1",
        quantity: 3,
      }
      expect(selection.productId).toBe("product-1")
      expect(selection.quantity).toBe(3)
    })
  })

  describe("error messages", () => {
    it("should provide clear error for empty name", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        name: "",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("name"))
        expect(issue?.message).toBe("Name is required")
      }
    })

    it("should provide clear error for invalid quantity", () => {
      const result = createInspirationSchema.safeParse({
        ...validInspiration,
        productSelections: [
          {
            productId: "product-1",
            quantity: 0,
          },
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe("type inference", () => {
    it("should correctly infer InspirationFormData type", () => {
      const result = createInspirationSchema.safeParse(validInspiration)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.name).toBe("string")
        expect(Array.isArray(result.data.productSelections)).toBe(true)
        expect(result.data.productSelections[0].quantity).toBeGreaterThan(0)
      }
    })
  })
})
