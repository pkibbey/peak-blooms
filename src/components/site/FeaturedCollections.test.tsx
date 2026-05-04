import { describe, expect, it, vi } from "vitest"
import * as collectionsModule from "@/lib/data/collections"
import FeaturedCollections from "./FeaturedCollections"

vi.mock("@/lib/data/collections")

describe("FeaturedCollections component", () => {
  it("renders null when getFeaturedCollections throws", async () => {
    vi.spyOn(collectionsModule, "getFeaturedCollections").mockRejectedValueOnce(
      new Error("DB error")
    )

    const Comp = await FeaturedCollections()

    expect(Comp).toBeNull()
  })
})
