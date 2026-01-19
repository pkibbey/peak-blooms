import { describe, expect, it } from "vitest"
import { COLOR_IDS, COLOR_MAP, COLORS, getColorById, getHexById } from "@/lib/colors"

describe("COLOR_IDS registry", () => {
  describe("structure validation", () => {
    it("should have COLOR_IDS array defined", () => {
      expect(Array.isArray(COLOR_IDS)).toBe(true)
    })

    it("should have at least one color ID", () => {
      expect(COLOR_IDS.length).toBeGreaterThan(0)
    })
  })

  describe("COLOR_IDS uniqueness", () => {
    it("should have unique color IDs", () => {
      const uniqueIds = new Set(COLOR_IDS)
      expect(uniqueIds.size).toBe(COLOR_IDS.length)
    })

    it("should have lowercase ids with optional hyphens", () => {
      COLOR_IDS.forEach((id) => {
        expect(id.toLowerCase()).toBe(id)
        expect(id).toMatch(/^[a-z-]+$/)
      })
    })
  })
})

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

  describe("specific color validation", () => {
    it("should contain common flower colors", () => {
      const colorIds = COLORS.map((c) => c.id)
      expect(colorIds).toContain("pink")
      expect(colorIds).toContain("red")
      expect(colorIds).toContain("white")
    })

    it("should contain greenery color", () => {
      const colorIds = COLORS.map((c) => c.id)
      expect(colorIds).toContain("green")
    })
  })

  describe("color lookup utilities", () => {
    it("should be able to find color by id using getColorById", () => {
      const color = getColorById("pink")
      expect(color).toBeDefined()
      expect(color?.label).toBe("Pink")
    })

    it("should get hex color by ID using getHexById", () => {
      const hex = getHexById("pink")
      expect(hex).toBe("#FF9ECF")
    })

    it("should return default hex for unknown IDs", () => {
      const hex = getHexById("unknown-color")
      expect(hex).toBe("#000000")
    })
  })

  describe("COLOR_MAP validation", () => {
    it("should have all COLORS in COLOR_MAP", () => {
      COLORS.forEach((color) => {
        const mapped = COLOR_MAP.get(color.id)
        expect(mapped).toBeDefined()
        expect(mapped?.id).toBe(color.id)
      })
    })

    it("should have COLOR_MAP for efficient lookups", () => {
      expect(COLOR_MAP.size).toBeGreaterThan(0)
      expect(COLOR_MAP.get("pink")).toBeDefined()
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
    it("should be usable for product color selection", () => {
      const validColorIds = COLORS.map((c) => c.id)
      expect(validColorIds).toContain("pink")
      const testSelection = ["pink", "white"]
      const allValid = testSelection.every((id) => validColorIds.includes(id))
      expect(allValid).toBe(true)
    })
  })
})
