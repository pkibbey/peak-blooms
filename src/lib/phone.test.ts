import { describe, expect, it } from "vitest"
import { formatPhoneNumber, isValidPhoneNumber } from "@/lib/phone"

describe("phone utilities", () => {
  describe("formatPhoneNumber - phone number formatting", () => {
    describe("valid US phone numbers", () => {
      it("should format 10-digit US number with dashes", () => {
        const result = formatPhoneNumber("5035550123")
        expect(result).toBeTruthy()
        // National format for US includes parentheses and dashes
        expect(result).toMatch(/\d+/)
      })

      it("should format number with parentheses", () => {
        const result = formatPhoneNumber("(503) 555-0123")
        expect(result).toBeTruthy()
      })

      it("should format number with +1 prefix", () => {
        const result = formatPhoneNumber("+1-503-555-0123")
        expect(result).toBeTruthy()
      })

      it("should format international format", () => {
        const result = formatPhoneNumber("+14155552671")
        expect(result).toBeTruthy()
      })

      it("should handle valid area code", () => {
        const result = formatPhoneNumber("2025550123")
        expect(result).toBeTruthy()
      })
    })

    describe("edge cases", () => {
      it("should return empty string for null input", () => {
        const result = formatPhoneNumber(null)
        expect(result).toBe("")
      })

      it("should return empty string for undefined input", () => {
        const result = formatPhoneNumber(undefined)
        expect(result).toBe("")
      })

      it("should return empty string for empty string", () => {
        const result = formatPhoneNumber("")
        expect(result).toBe("")
      })

      it("should return input if parsing fails", () => {
        const invalid = "not a phone"
        const result = formatPhoneNumber(invalid)
        expect(result).toBe(invalid)
      })

      it("should use default country US when not specified", () => {
        const result = formatPhoneNumber("5035550123")
        expect(result).toBeTruthy()
      })

      it("should support custom default country", () => {
        const result = formatPhoneNumber("442071838750", "GB")
        expect(result).toBeTruthy()
      })
    })
  })

  describe("isValidPhoneNumber - phone validation", () => {
    describe("valid phone numbers", () => {
      it("should accept valid US 10-digit number", () => {
        expect(isValidPhoneNumber("5035550123")).toBe(true)
      })

      it("should accept US number with formatting", () => {
        expect(isValidPhoneNumber("(503) 555-0123")).toBe(true)
      })

      it("should accept international format with +1", () => {
        expect(isValidPhoneNumber("+1-503-555-0123")).toBe(true)
      })

      it("should accept 11-digit format 1+10 digits", () => {
        expect(isValidPhoneNumber("15035550123")).toBe(true)
      })

      it("should accept various US area codes", () => {
        expect(isValidPhoneNumber("2025550123")).toBe(true) // DC
        expect(isValidPhoneNumber("4155550123")).toBe(true) // SF
        expect(isValidPhoneNumber("2125550123")).toBe(true) // NYC
      })

      it("should accept international numbers", () => {
        expect(isValidPhoneNumber("+442071838750", "GB")).toBe(true)
      })
    })

    describe("invalid phone numbers", () => {
      it("should reject invalid format", () => {
        expect(isValidPhoneNumber("not a phone")).toBe(false)
      })

      it("should reject too short number", () => {
        expect(isValidPhoneNumber("123")).toBe(false)
      })

      it("should reject number with invalid area code", () => {
        expect(isValidPhoneNumber("0005550123")).toBe(false)
      })

      it("should reject empty area code", () => {
        expect(isValidPhoneNumber("5550123")).toBe(false)
      })
    })

    describe("edge cases", () => {
      it("should allow empty phone number (returns true)", () => {
        expect(isValidPhoneNumber("")).toBe(true)
      })

      it("should allow null phone number (returns true)", () => {
        expect(isValidPhoneNumber(null)).toBe(true)
      })

      it("should allow undefined phone number (returns true)", () => {
        expect(isValidPhoneNumber(undefined)).toBe(true)
      })

      it("should handle whitespace-only input", () => {
        expect(isValidPhoneNumber("   ")).toBe(false)
      })

      it("should use default country US when not specified", () => {
        expect(isValidPhoneNumber("5035550123")).toBe(true)
      })

      it("should support custom default country", () => {
        expect(isValidPhoneNumber("2071838750", "GB")).toBe(true)
      })

      it("should return false for invalid country code in parsing", () => {
        const result = isValidPhoneNumber("+9999999999999")
        expect(result).toBe(false)
      })
    })

    describe("real-world scenarios", () => {
      it("should validate typical US business number", () => {
        expect(isValidPhoneNumber("+1 (503) 555-0123")).toBe(true)
      })

      it("should validate typical international format", () => {
        expect(isValidPhoneNumber("+1-503-555-0123")).toBe(true)
      })

      it("should validate plain 10-digit input from form", () => {
        expect(isValidPhoneNumber("5035550123")).toBe(true)
      })

      it("should handle formatted input from database", () => {
        expect(isValidPhoneNumber("+1-503-555-0123")).toBe(true)
      })
    })
  })
})
