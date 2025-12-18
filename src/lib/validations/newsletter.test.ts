import { describe, expect, it } from "vitest"
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter"

describe("newsletterSubscribeSchema", () => {
  describe("valid inputs", () => {
    it("should accept valid email", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "subscriber@example.com",
      })
      expect(result.success).toBe(true)
    })

    it("should accept various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "john.doe@domain.co.uk",
        "test+tag@company.org",
        "name_surname@mail.com",
      ]

      validEmails.forEach((email) => {
        const result = newsletterSubscribeSchema.safeParse({ email })
        expect(result.success).toBe(true)
      })
    })

    it("should accept email with numbers and special chars", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "test123@example.com",
      })
      expect(result.success).toBe(true)
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing email", () => {
      const result = newsletterSubscribeSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it("should reject empty email string", () => {
      const result = newsletterSubscribeSchema.safeParse({ email: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Email is required")
      }
    })

    it("should reject invalid email format (no @)", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "notanemail",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email")
      }
    })

    it("should reject invalid email format (no domain)", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "user@",
      })
      expect(result.success).toBe(false)
    })

    it("should reject invalid email format (no local part)", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "@example.com",
      })
      expect(result.success).toBe(false)
    })

    it("should reject email with spaces", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "user @example.com",
      })
      expect(result.success).toBe(false)
    })

    it("should reject whitespace-only email", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "   ",
      })
      expect(result.success).toBe(false)
    })
  })

  describe("error messages", () => {
    it("should provide clear error message for empty email", () => {
      const result = newsletterSubscribeSchema.safeParse({ email: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("email"))
        expect(issue?.message).toBe("Email is required")
      }
    })

    it("should provide clear error message for invalid email format", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "invalid-email",
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("email"))
        expect(issue?.message).toContain("valid email address")
      }
    })
  })

  describe("type inference", () => {
    it("should correctly infer NewsletterSubscribeFormData type", () => {
      const result = newsletterSubscribeSchema.safeParse({
        email: "test@example.com",
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(typeof result.data.email).toBe("string")
        expect(result.data.email).toBe("test@example.com")
      }
    })
  })
})
