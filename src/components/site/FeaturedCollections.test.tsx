import { render } from "@testing-library/react"
import type { ReactElement } from "react"
import { describe, expect, it, vi } from "vitest"
import * as collectionsModule from "@/lib/data/collections"
import FeaturedCollections from "./FeaturedCollections"

vi.mock("@/lib/data/collections")

describe("FeaturedCollections component", () => {
  it("renders fallback message when getFeaturedCollections throws", async () => {
    vi.spyOn(collectionsModule, "getFeaturedCollections").mockRejectedValueOnce(
      new Error("DB error")
    )

    const Comp = await FeaturedCollections()
    const { container } = render(Comp as ReactElement)

    expect(container).toHaveTextContent("No featured collections available.")
  })
})
