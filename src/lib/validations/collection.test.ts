import { describe, expect, it } from "vitest"
import { collectionSchema } from "@/lib/validations/collection"

describe("collectionSchema", () => {
  const validCollection = {
    name: "Spring Bouquets",
    slug: "spring-bouquets",
    image: "https://example.com/spring.jpg",
    description: "Fresh spring flower collections",
    featured: true,
  }

  describe("valid inputs", () => {
    it("should accept valid collection", () => {
      const result = collectionSchema.safeParse(validCollection)
      expect(result.success).toBe(true)
    })

    it("should accept collection with featured as false", () => {
      const result = collectionSchema.safeParse({
        ...validCollection,
        featured: false,
      })
      expect(result.success).toBe(true)
    })

    it("should accept collection with empty description", () => {
      const result = collectionSchema.safeParse({
        ...validCollection,
        description: "",
      })
      expect(result.success).toBe(true)
    })

    it("should accept collection with various name lengths", () => {
      const names = ["A", "Wedding Flowers", "Summer Garden Arrangements"]
      names.forEach((name) => {
        const result = collectionSchema.safeParse({ ...validCollection, name })
        expect(result.success).toBe(true)
      })
    })

    it("should accept collection with slug containing hyphens", () => {
      const result = collectionSchema.safeParse({
        ...validCollection,
        slug: "best-wedding-flowers-2024",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing name", () => {
      const { name, ...noName } = validCollection
      const result = collectionSchema.safeParse(noName)
      expect(result.success).toBe(false)
    })

    it("should reject empty name", () => {
      const result = collectionSchema.safeParse({
        ...validCollection,
        name: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing slug", () => {
      const { slug, ...noSlug } = validCollection
      const result = collectionSchema.safeParse(noSlug)
      expect(result.success).toBe(false)
    })

    it("should reject empty slug", () => {
      const result = collectionSchema.safeParse({
        ...validCollection,
        slug: "",
      })
      expect(result.success).toBe(false)
    })

    it("should reject missing image", () => {
      const { image, ...noImage } = validCollection
      const result = collectionSchema.safeParse(noImage)
      expect(result.success).toBe(false)
    })

    it("should reject missing description", () => {
      const { description, ...noDescription } = validCollection
      const result = collectionSchema.safeParse(noDescription)
      expect(result.success).toBe(false)
    })

    it("should reject missing featured flag", () => {
      const { featured, ...noFeatured } = validCollection
      const result = collectionSchema.safeParse(noFeatured)
      expect(result.success).toBe(false)
    })

    it("should reject non-boolean featured value", () => {
      const result = collectionSchema.safeParse({
        ...validCollection,
        featured: "yes",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("error messages", () => {
    it("should provide clear error message for empty name", () => {
      const result = collectionSchema.safeParse({ ...validCollection, name: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("name"))
        expect(issue?.message).toBe("Collection name is required")
      }
    })

    it("should provide clear error message for empty slug", () => {
      const result = collectionSchema.safeParse({ ...validCollection, slug: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("slug"))
        expect(issue?.message).toBe("Slug is required")
      }
    })
  })

  describe("type inference", () => {
    it("should correctly infer CollectionFormData type", () => {
      const result = collectionSchema.safeParse(validCollection)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.name).toBe("string")
        expect(typeof result.data.featured).toBe("boolean")
      }
    })
  })
})
