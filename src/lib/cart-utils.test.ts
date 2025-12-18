import { describe, expect, it } from "vitest"
import { calculateCartTotal } from "@/lib/cart-utils"

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

    it("should skip market-priced items (null price)", () => {
      const cartItems = [
        {
          product: { price: 50 },
          quantity: 2,
        },
        {
          product: { price: null },
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

    it("should handle mixed valid and null-priced items", () => {
      const cartItems = [
        {
          product: { price: 25 },
          quantity: 2,
        },
        {
          product: { price: null },
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

    it("should only skip items with price === null, not falsy values", () => {
      const cartItems = [
        {
          product: { price: 0 },
          quantity: 2,
        },
      ]
      const total = calculateCartTotal(cartItems)
      expect(total).toBe(0) // Price of 0 should still be included
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
          product: { price: null },
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
