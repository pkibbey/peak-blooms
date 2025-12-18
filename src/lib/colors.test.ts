import { describe, expect, it } from "vitest"
import { COLORS } from "@/lib/colors"

describe("COLORS registry", () => {
  describe("structure validation", () => {
    it("should have colors array defined", () => {
      expect(Array.isArray(COLORS)).toBe(true)
    })

    it("should have at least one color", () => {
      expect(COLORS.length).toBeGreaterThan(0)
    })

    it("should have all required color properties", () => {
      COLORS.forEach((color) => {
        expect(color).toHaveProperty("id")
        expect(color).toHaveProperty("label")
        expect(color).toHaveProperty("hex")
        expect(color).toHaveProperty("category")
      })
    })
  })

  describe("color properties", () => {
    it("should have valid hex codes", () => {
      COLORS.forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/i)
      })
    })

    it("should have non-empty string ids", () => {
      COLORS.forEach((color) => {
        expect(typeof color.id).toBe("string")
        expect(color.id.length).toBeGreaterThan(0)
        expect(color.id).toMatch(/^[a-z-]+$/) // lowercase with hyphens
      })
    })

    it("should have non-empty string labels", () => {
      COLORS.forEach((color) => {
        expect(typeof color.label).toBe("string")
        expect(color.label.length).toBeGreaterThan(0)
      })
    })

    it("should have valid categories", () => {
      const validCategories = ["flower", "greenery", "neutral"]
      COLORS.forEach((color) => {
        expect(validCategories).toContain(color.category)
      })
    })
  })

  describe("uniqueness validation", () => {
    it("should have unique ids", () => {
      const ids = COLORS.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it("should have unique labels", () => {
      const labels = COLORS.map((c) => c.label)
      const uniqueLabels = new Set(labels)
      expect(uniqueLabels.size).toBe(labels.length)
    })

    it("should have unique hex codes", () => {
      const hexes = COLORS.map((c) => c.hex)
      const uniqueHexes = new Set(hexes)
      expect(uniqueHexes.size).toBe(hexes.length)
    })
  })

  describe("category distribution", () => {
    it("should have at least one flower color", () => {
      const flowers = COLORS.filter((c) => c.category === "flower")
      expect(flowers.length).toBeGreaterThan(0)
    })

    it("should have at least one greenery color", () => {
      const greenery = COLORS.filter((c) => c.category === "greenery")
      expect(greenery.length).toBeGreaterThan(0)
    })

    it("should have at least one neutral color", () => {
      const neutral = COLORS.filter((c) => c.category === "neutral")
      expect(neutral.length).toBeGreaterThan(0)
    })
  })

  describe("specific color validation", () => {
    it("should contain common flower colors", () => {
      const colorIds = COLORS.map((c) => c.id)
      expect(colorIds).toContain("pink")
      expect(colorIds).toContain("red")
      expect(colorIds).toContain("white")
    })

    it("should contain common greenery colors", () => {
      const colorIds = COLORS.map((c) => c.id)
      expect(colorIds).toContain("greenery")
      expect(colorIds).toContain("sage")
      expect(colorIds).toContain("eucalyptus")
    })

    it("white should be neutral", () => {
      const white = COLORS.find((c) => c.id === "white")
      expect(white?.category).toBe("neutral")
    })

    it("should have coral flower color with correct hex", () => {
      const coral = COLORS.find((c) => c.id === "coral")
      expect(coral?.label).toBe("Coral")
      expect(coral?.hex).toBe("#FF6B6B")
      expect(coral?.category).toBe("flower")
    })
  })

  describe("color lookup utilities", () => {
    it("should be able to find color by id", () => {
      const color = COLORS.find((c) => c.id === "pink")
      expect(color).toBeDefined()
      expect(color?.label).toBe("Pink")
    })

    it("should be able to find color by label", () => {
      const color = COLORS.find((c) => c.label === "Rose")
      expect(color).toBeDefined()
      expect(color?.id).toBe("rose")
    })

    it("should be able to find colors by category", () => {
      const flowers = COLORS.filter((c) => c.category === "flower")
      expect(flowers.length).toBeGreaterThan(0)
      flowers.forEach((f) => {
        expect(f.category).toBe("flower")
      })
    })
  })

  describe("data consistency", () => {
    it("should have descriptive labels that start with capital letter", () => {
      COLORS.forEach((color) => {
        expect(color.label[0]).toMatch(/[A-Z]/)
      })
    })

    it("should have hex codes in uppercase", () => {
      COLORS.forEach((color) => {
        expect(color.hex).toMatch(/^#[0-9A-F]{6}$/)
      })
    })

    it("should have lowercase ids with optional hyphens", () => {
      COLORS.forEach((color) => {
        expect(color.id.toLowerCase()).toBe(color.id)
      })
    })
  })

  describe("real-world usage", () => {
    it("should support filtering flowers for UI dropdown", () => {
      const flowers = COLORS.filter((c) => c.category === "flower")
      expect(flowers.length).toBeGreaterThan(10)
    })

    it("should support filtering greenery for UI dropdown", () => {
      const greenery = COLORS.filter((c) => c.category === "greenery")
      expect(greenery.length).toBeGreaterThan(3)
    })

    it("should be usable for product color selection", () => {
      const validColorIds = COLORS.map((c) => c.id)
      expect(validColorIds).toContain("pink")
      const testSelection = ["pink", "greenery"]
      const allValid = testSelection.every((id) => validColorIds.includes(id))
      expect(allValid).toBe(true)
    })
  })
})
