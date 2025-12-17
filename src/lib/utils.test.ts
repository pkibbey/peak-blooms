import { describe, expect, it } from "vitest"
import {
  adjustPrice,
  cn,
  formatPrice,
  isValidPriceMultiplier,
  MAX_PRICE_MULTIPLIER,
  MIN_PRICE_MULTIPLIER,
} from "@/lib/utils"

describe("cn - className merger", () => {
  it("should merge class names", () => {
    const result = cn("px-2", "py-1")
    expect(result).toBe("px-2 py-1")
  })

  it("should handle conflicting Tailwind classes", () => {
    const result = cn("px-2 px-4")
    expect(result).toBe("px-4")
  })

  it("should handle conditional classes", () => {
    const isActive = true
    const result = cn("base", isActive && "active")
    expect(result).toContain("base")
    expect(result).toContain("active")
  })
})

describe("adjustPrice - price multiplier", () => {
  it("should multiply price by adjustment factor", () => {
    expect(adjustPrice(100, 1.5)).toBe(150)
  })

  it("should return null when basePrice is null", () => {
    expect(adjustPrice(null, 1.5)).toBeNull()
  })

  it("should round to 2 decimal places", () => {
    expect(adjustPrice(10, 1.33)).toBe(13.3)
  })

  it("should use default multiplier of 1.0", () => {
    expect(adjustPrice(100)).toBe(100)
  })

  it("should handle small prices", () => {
    expect(adjustPrice(0.99, 2)).toBe(1.98)
  })

  it("should handle zero price", () => {
    expect(adjustPrice(0, 5)).toBe(0)
  })
})

describe("isValidPriceMultiplier", () => {
  it("should accept valid multiplier at minimum bound", () => {
    expect(isValidPriceMultiplier(MIN_PRICE_MULTIPLIER)).toBe(true)
  })

  it("should accept valid multiplier at maximum bound", () => {
    expect(isValidPriceMultiplier(MAX_PRICE_MULTIPLIER)).toBe(true)
  })

  it("should accept valid multiplier in middle range", () => {
    expect(isValidPriceMultiplier(1.0)).toBe(true)
    expect(isValidPriceMultiplier(5.0)).toBe(true)
  })

  it("should reject multiplier below minimum", () => {
    expect(isValidPriceMultiplier(0.4)).toBe(false)
  })

  it("should reject multiplier above maximum", () => {
    expect(isValidPriceMultiplier(21.0)).toBe(false)
  })

  it("should reject NaN", () => {
    expect(isValidPriceMultiplier(NaN)).toBe(false)
  })

  it("should reject non-number values", () => {
    expect(isValidPriceMultiplier("1" as any)).toBe(false)
  })
})

describe("formatPrice - currency formatting", () => {
  it("should format regular price as USD", () => {
    const result = formatPrice(99.99)
    expect(result).toContain("$")
    expect(result).toContain("99.99")
  })

  it('should return "Market Price" for null', () => {
    expect(formatPrice(null)).toBe("Market Price")
  })

  it("should format whole dollar amounts", () => {
    const result = formatPrice(100)
    expect(result).toContain("100")
  })

  it("should handle zero price", () => {
    const result = formatPrice(0)
    expect(result).toContain("0")
  })

  it("should handle large prices", () => {
    const result = formatPrice(1000000)
    expect(result).toContain("1,000,000")
  })
})
