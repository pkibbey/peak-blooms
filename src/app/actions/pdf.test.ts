import { describe, expect, it } from "vitest"
import { computeOrderTax } from "./pdf"

describe("computeOrderTax", () => {
  it("computes CA tax for CA delivery state", async () => {
    const order = {
      items: [{ price: 100, quantity: 1 }],
      deliveryAddress: { state: "CA" },
    }

    const res = await computeOrderTax(order)
    expect(res.isCalifornia).toBe(true)
    expect(res.tax).toBe(7.25)
    expect(res.taxLabel).toContain("CA 7.25%")
  })

  it("always applies CA tax regardless of delivery state", async () => {
    const order = {
      items: [{ price: 100, quantity: 1 }],
      deliveryAddress: { state: "NY" },
    }

    const res = await computeOrderTax(order)
    expect(res.isCalifornia).toBe(true)
    expect(res.tax).toBe(7.25)
    expect(res.taxLabel).toContain("CA 7.25%")
  })
})
