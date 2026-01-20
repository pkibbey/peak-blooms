import { afterEach, describe, expect, it, vi } from "vitest"
import { pickRandomFirstStyle } from "./ai-prompt-templates"

describe("pickRandomFirstStyle", () => {
  const original = Math.random

  afterEach(() => {
    // restore
    Math.random = original
    vi.resetAllMocks()
  })

  it("returns editorial when Math.random is low", () => {
    Math.random = () => 0.0
    expect(pickRandomFirstStyle()).toBe("editorial")
  })

  it("returns botanical for mid-range values", () => {
    Math.random = () => 0.4
    expect(pickRandomFirstStyle()).toBe("botanical")
  })

  it("returns lifestyle (garden) for high values", () => {
    Math.random = () => 0.9
    expect(pickRandomFirstStyle()).toBe("lifestyle")
  })
})
