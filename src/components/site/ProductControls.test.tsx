import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

// Mock AddToCartButton because it uses next-auth and next/navigation which
// are unnecessary in this unit test and would complicate the environment.
vi.mock("@/components/site/AddToCartButton", () => ({
  default: () => <div data-testid="add-to-cart" />,
}))

import { ProductControls } from "./ProductControls"

describe("ProductControls - boxlot behavior", () => {
  it("only shows stem lengths and counts from variants that have both values when all variants are boxlots", () => {
    const product = {
      id: "p1",
      name: "Boxlot Product",
      variants: [
        { id: "v1", price: 100, stemLength: 45, countPerBunch: 100, isBoxlot: true },
        // incomplete boxlot variants (missing stemLength or countPerBunch)
        { id: "v2", price: 50, stemLength: null, countPerBunch: 100, isBoxlot: true },
        { id: "v3", price: 75, stemLength: 60, countPerBunch: null, isBoxlot: true },
      ],
    }

    render(<ProductControls product={product} user={{ approved: true }} mode="detail" />)

    // The only valid pair is the first variant (45cm, 100 stems)
    expect(screen.getByText("45 cm")).toBeInTheDocument()
    expect(screen.getByText("x 100")).toBeInTheDocument()

    // The incomplete values should not be offered as selectable options
    expect(screen.queryByText("60 cm")).not.toBeInTheDocument()
    // For completeness, assert there is only one stem length option
    const lengthButtons = screen.getAllByText(/cm$/)
    expect(lengthButtons).toHaveLength(1)
  })

  it("resets default selection when src variants change (simulating bulk boxlots toggle)", () => {
    const initialProduct = {
      id: "p2",
      name: "Mixed Product",
      variants: [
        { id: "a1", price: 10, stemLength: 55, countPerBunch: 16, isBoxlot: false },
        { id: "a2", price: 5, stemLength: 45, countPerBunch: 8, isBoxlot: false },
      ],
    }

    const { rerender } = render(
      <ProductControls product={initialProduct} user={{ approved: true }} mode="detail" />
    )

    // initial sorted stem lengths: [45, 55], so default should be 45
    expect(screen.getByText("45 cm")).toBeInTheDocument()

    // Now switch to boxlot-only variants (simulates toggling bulk boxlots filter)
    const boxlotProduct = {
      id: "p2",
      name: "Mixed Product",
      variants: [
        { id: "b1", price: 200, stemLength: 50, countPerBunch: 50, isBoxlot: true },
        { id: "b2", price: 300, stemLength: 60, countPerBunch: 100, isBoxlot: true },
      ],
    }

    rerender(<ProductControls product={boxlotProduct} user={{ approved: true }} mode="detail" />)

    // after toggling to boxlot-only, selectors should reset to boxlot defaults: 50cm and x 50
    expect(screen.getByText("50 cm")).toBeInTheDocument()
    expect(screen.getByText("x 50")).toBeInTheDocument()
  })
})
