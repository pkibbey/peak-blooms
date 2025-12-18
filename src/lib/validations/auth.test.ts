import { describe, expect, it } from "vitest"
import { profileSchema } from "@/lib/validations/auth"

describe("profileSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid profile with name", () => {
      const result = profileSchema.safeParse({ name: "John Doe" })
      expect(result.success).toBe(true)
    })

    it("should accept profile with various name formats", () => {
      const names = ["John", "John Doe", "Jean-Pierre Dupont", "María García"]
      names.forEach((name) => {
        const result = profileSchema.safeParse({ name })
        expect(result.success).toBe(true)
      })
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing name", () => {
      const result = profileSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject undefined name", () => {
      const result = profileSchema.safeParse({ name: undefined })
      expect(result.success).toBe(false)
    })
  })

  describe("type inference", () => {
    it("should correctly infer parsed type", () => {
      const result = profileSchema.safeParse({ name: "Test User" })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe("Test User")
        expect(typeof result.data.name).toBe("string")
      }
    })
  })
})
