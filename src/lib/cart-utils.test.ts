import { describe, expect, it } from "vitest"
import { applyPriceMultiplierToItems, calculateCartTotal } from "@/lib/cart-utils"

// Test type for items that satisfy the generic constraint
type TestPriceItem = {
  quantity?: number
  product?: { price: number; [key: string]: unknown } | null
}

describe("calculateCartTotal - cart total calculation", () => {
  describe("valid inputs", () => {
    it("should calculate total for single item", () => {
      const cartItems = [
        {
          product: { price: 50 },
          quantity: 1,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(50)
    })

    it("should calculate total for multiple items", () => {
      const cartItems = [
        {
          product: { price: 50 },
          quantity: 2,
        },
        {
          product: { price: 30 },
          quantity: 1,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(130) // 50*2 + 30*1
    })

    it("should skip market-priced items (0 price)", () => {
      const cartItems = [
        {
          product: { price: 50 },
          quantity: 2,
        },
        {
          product: { price: 0 },
          quantity: 1,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(100) // Only counts first item
    })

    it("should handle decimal prices correctly", () => {
      const cartItems = [
        {
          product: { price: 10.99 },
          quantity: 3,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(32.97)
    })

    it("should round total to 2 decimal places", () => {
      const cartItems = [
        {
          product: { price: 10.33 },
          quantity: 3,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(30.99)
    })

    it("should handle items with null product", () => {
      const cartItems = [
        {
          product: null,
          quantity: 2,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(0)
    })

    it("should handle items with undefined product", () => {
      const cartItems = [
        {
          quantity: 2,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(0)
    })

    it("should handle mixed valid and 0-priced items", () => {
      const cartItems = [
        {
          product: { price: 25 },
          quantity: 2,
        },
        {
          product: { price: 0 },
          quantity: 1,
        },
        {
          product: { price: 15.5 },
          quantity: 3,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(96.5) // 25*2 + 15.50*3
    })

    it("should handle zero prices", () => {
      const cartItems = [
        {
          product: { price: 0 },
          quantity: 5,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(0)
    })

    it("should handle large quantities", () => {
      const cartItems = [
        {
          product: { price: 1.99 },
          quantity: 1000,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(1990)
    })
  })

  describe("edge cases", () => {
    it("should handle very small prices with quantity", () => {
      const cartItems = [
        {
          product: { price: 0.01 },
          quantity: 3,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(0.03)
    })

    it("should skip market-priced items with price === 0", () => {
      const cartItems = [
        {
          product: { price: 0 },
          quantity: 2,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(0) // Price of 0 should be skipped as market price
    })

    it("should handle high-precision decimal rounding correctly", () => {
      const cartItems = [
        {
          product: { price: 33.33 },
          quantity: 3,
        },
      ]
      const total = calculateCartTotal(cartItems)
      // 33.33 * 3 = 99.99
      expect(total).toBe(99.99)
    })
  })

  describe("real-world scenarios", () => {
    it("should calculate typical flower order", () => {
      const cartItems = [
        {
          product: { price: 49.99 },
          quantity: 1, // One bouquet
        },
        {
          product: { price: 5.0 },
          quantity: 1, // Greeting card
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(54.99)
    })

    it("should handle order with multiple bouquets and gifts", () => {
      const cartItems = [
        {
          product: { price: 49.99 },
          quantity: 2, // Two bouquets
        },
        {
          product: { price: 0 },
          quantity: 1, // Market-priced vase
        },
        {
          product: { price: 15.0 },
          quantity: 1, // Gift wrapping
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(114.98) // 49.99*2 + 15.0
    })
  })
})
describe("applyPriceMultiplierToItems - apply price multiplier to cart items", () => {
  describe("valid multipliers", () => {
    it("should apply multiplier of 1.0 (no change)", () => {
      const items = [
        {
          product: { price: 50, name: "Roses" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.0)
      expect(result[0].product?.price).toBe(50)
    })

    it("should apply multiplier greater than 1.0", () => {
      const items = [
        {
          product: { price: 100, name: "Premium Roses" },
          quantity: 2,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].product?.price).toBe(150)
    })

    it("should apply multiplier less than 1.0 (discount)", () => {
      const items = [
        {
          product: { price: 100, name: "Discount Roses" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 0.8)
      expect(result[0].product?.price).toBe(80)
    })

    it("should handle decimal multipliers", () => {
      const items = [
        {
          product: { price: 49.99, name: "Bouquet" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.25)
      expect(result[0].product?.price).toBe(62.49)
    })

    it("should round to 2 decimal places", () => {
      const items = [
        {
          product: { price: 33.33, name: "Item" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      // 33.33 * 1.5 = 49.995, rounded to 50.00
      expect(result[0].product?.price).toBe(50)
    })
  })

  describe("multiple items", () => {
    it("should apply multiplier to all items", () => {
      const items = [
        {
          product: { price: 50, name: "Item1" },
          quantity: 1,
        },
        {
          product: { price: 100, name: "Item2" },
          quantity: 1,
        },
        {
          product: { price: 25, name: "Item3" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 2.0)
      expect(result[0].product?.price).toBe(100)
      expect(result[1].product?.price).toBe(200)
      expect(result[2].product?.price).toBe(50)
    })

    it("should preserve other product properties", () => {
      const items = [
        {
          product: { price: 50, name: "Roses", id: "prod-1", color: "red" },
          quantity: 2,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].product?.name).toBe("Roses")
      expect(result[0].product?.id).toBe("prod-1")
      expect(result[0].product?.color).toBe("red")
      expect(result[0].product?.price).toBe(75)
    })

    it("should preserve quantity", () => {
      const items = [
        {
          product: { price: 50, name: "Item" },
          quantity: 5,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].quantity).toBe(5)
    })
  })

  describe("zero prices (market-priced items)", () => {
    it("should keep 0 prices as 0", () => {
      const items = [
        {
          product: { price: 0, name: "Market Item" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].product?.price).toBe(0)
    })

    it("should handle mix of 0 and regular prices", () => {
      const items = [
        {
          product: { price: 50, name: "Fixed" },
          quantity: 1,
        },
        {
          product: { price: 0, name: "Market" },
          quantity: 1,
        },
        {
          product: { price: 75, name: "Fixed2" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 2.0)
      expect(result[0].product?.price).toBe(100)
      expect(result[1].product?.price).toBe(0)
      expect(result[2].product?.price).toBe(150)
    })
  })

  describe("null/undefined products", () => {
    it("should handle items with null product", () => {
      const items = [
        {
          product: null,
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].product).toBeNull()
    })

    it("should handle items with undefined product", () => {
      const items: TestPriceItem[] = [
        {
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].product).toBeNull()
    })

    it("should handle mixed items with some null products", () => {
      const items = [
        {
          product: { price: 50, name: "Item1" },
          quantity: 1,
        },
        {
          product: null,
          quantity: 1,
        },
        {
          product: { price: 75, name: "Item3" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 2.0)
      expect(result[0].product?.price).toBe(100)
      expect(result[1].product).toBeNull()
      expect(result[2].product?.price).toBe(150)
    })
  })

  describe("zero price and zero multiplier", () => {
    it("should handle zero prices", () => {
      const items = [
        {
          product: { price: 0, name: "Free Item" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.5)
      expect(result[0].product?.price).toBe(0)
    })

    it("should handle zero multiplier", () => {
      const items = [
        {
          product: { price: 100, name: "Item" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 0)
      expect(result[0].product?.price).toBe(0)
    })
  })

  describe("real-world scenarios", () => {
    it("should apply VIP customer discount (0.85 multiplier)", () => {
      const items = [
        {
          product: { price: 49.99, name: "Roses" },
          quantity: 2,
        },
        {
          product: { price: 29.99, name: "Lilies" },
          quantity: 1,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 0.85)
      expect(result[0].product?.price).toBe(42.49)
      expect(result[1].product?.price).toBe(25.49)
    })

    it("should apply wholesale markup (1.75 multiplier)", () => {
      const items = [
        {
          product: { price: 20, name: "Item1" },
          quantity: 5,
        },
        {
          product: { price: 15, name: "Item2" },
          quantity: 3,
        },
      ]
      const result = applyPriceMultiplierToItems(items, 1.75)
      expect(result[0].product?.price).toBe(35)
      expect(result[1].product?.price).toBe(26.25)
    })

    it("should not modify original array", () => {
      const items = [
        {
          product: { price: 50, name: "Item" },
          quantity: 1,
        },
      ]
      const originalPrice = items[0].product?.price
      applyPriceMultiplierToItems(items, 2.0)
      expect(items[0].product?.price).toBe(originalPrice)
    })
  })
})
