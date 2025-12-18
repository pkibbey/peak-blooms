import { describe, expect, it } from "vitest"
import { addressSchema } from "@/lib/validations/address"

describe("addressSchema", () => {
  const validAddress = {
    firstName: "John",
    lastName: "Doe",
    company: "Acme Inc",
    street1: "123 Main St",
    street2: "Apt 4B",
    city: "Portland",
    state: "OR",
    zip: "97201",
    country: "US",
    email: "john@example.com",
    phone: "+1-503-555-0123",
  }

  describe("valid inputs", () => {
    it("should accept valid address with all required fields", () => {
      const result = addressSchema.safeParse(validAddress)
      expect(result.success).toBe(true)
    })

    it("should accept address with empty street2", () => {
      const result = addressSchema.safeParse({ ...validAddress, street2: "" })
      expect(result.success).toBe(true)
    })

    it("should accept various valid phone formats", () => {
      const phoneFormats = ["+1-503-555-0123", "+1 (503) 555-0123", "5035550123", "+14155552671"]

      phoneFormats.forEach((phone) => {
        const result = addressSchema.safeParse({ ...validAddress, phone })
        expect(result.success).toBe(true)
      })
    })

    it("should accept valid email addresses", () => {
      const validEmails = ["test@example.com", "user+tag@domain.co.uk", "first.last@company.org"]

      validEmails.forEach((email) => {
        const result = addressSchema.safeParse({ ...validAddress, email })
        expect(result.success).toBe(true)
      })
    })
  })

  describe("invalid inputs", () => {
    it("should reject missing firstName", () => {
      const { firstName, ...noFirstName } = validAddress
      const result = addressSchema.safeParse(noFirstName)
      expect(result.success).toBe(false)
    })

    it("should reject missing lastName", () => {
      const { lastName, ...noLastName } = validAddress
      const result = addressSchema.safeParse(noLastName)
      expect(result.success).toBe(false)
    })

    it("should reject missing company field", () => {
      const { company, ...noCompany } = validAddress
      const result = addressSchema.safeParse(noCompany)
      expect(result.success).toBe(false)
    })

    it("should reject missing street1", () => {
      const { street1, ...noStreet1 } = validAddress
      const result = addressSchema.safeParse(noStreet1)
      expect(result.success).toBe(false)
    })

    it("should reject missing city", () => {
      const { city, ...noCity } = validAddress
      const result = addressSchema.safeParse(noCity)
      expect(result.success).toBe(false)
    })

    it("should reject missing state", () => {
      const { state, ...noState } = validAddress
      const result = addressSchema.safeParse(noState)
      expect(result.success).toBe(false)
    })

    it("should reject missing zip", () => {
      const { zip, ...noZip } = validAddress
      const result = addressSchema.safeParse(noZip)
      expect(result.success).toBe(false)
    })

    it("should reject missing email", () => {
      const { email, ...noEmail } = validAddress
      const result = addressSchema.safeParse(noEmail)
      expect(result.success).toBe(false)
    })

    it("should reject invalid email format", () => {
      const result = addressSchema.safeParse({ ...validAddress, email: "not-an-email" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email")
      }
    })

    it("should reject missing phone", () => {
      const { phone, ...noPhone } = validAddress
      const result = addressSchema.safeParse(noPhone)
      expect(result.success).toBe(false)
    })

    it("should reject invalid phone format", () => {
      const result = addressSchema.safeParse({ ...validAddress, phone: "invalid" })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid phone number")
      }
    })

    it("should reject empty string for firstName", () => {
      const result = addressSchema.safeParse({ ...validAddress, firstName: "" })
      expect(result.success).toBe(false)
    })

    it("should reject empty string for company", () => {
      const result = addressSchema.safeParse({ ...validAddress, company: "" })
      expect(result.success).toBe(false)
    })
  })

  describe("error messages", () => {
    it("should provide clear error message for empty firstName", () => {
      const result = addressSchema.safeParse({ ...validAddress, firstName: "" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("firstName"))
        expect(issue?.message).toBe("First name is required")
      }
    })

    it("should provide clear error message for invalid email", () => {
      const result = addressSchema.safeParse({ ...validAddress, email: "bad-email" })
      expect(result.success).toBe(false)
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path.includes("email"))
        expect(issue?.message).toContain("valid email")
      }
    })
  })
})
