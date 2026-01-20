/**
 * Canonical color registry for products (flowers + greenery).
 *
 * Each entry has:
 * - id: short machine id (used for lookups if desired)
 * - label: human friendly display name
 * - hex: canonical hex value to store in product.color
 * - category: 'flower' | 'greenery' | 'neutral'
 */

type ProductColor = {
  id: string
  label: string
  hex: string
}

// Export canonical ids as a const-friendly list for type derivation & runtime checks
// This is the source of truth for valid color IDs in the system
export const COLOR_IDS = [
  "pink",
  "hot-pink",
  "light-pink",
  "blush",
  "red",
  "white",
  "yellow",
  "orange",
  "cream",
  "ivory",
  "coral",
  "peach",
  "blue",
  "purple",
  "lavender",
  "green",
  "tinted",
  "other",
] as const

export const COLORS: ProductColor[] = [
  // Flowers / warm
  { id: "coral", label: "Coral", hex: "#FF6B6B" },
  { id: "peach", label: "Peach", hex: "#F7A582" },
  { id: "blush", label: "Blush", hex: "#F4C6D7" },
  { id: "pink", label: "Pink", hex: "#FF9ECF" },
  { id: "hot-pink", label: "Hot Pink", hex: "#FF1493" },
  { id: "light-pink", label: "Light Pink", hex: "#FFB6C1" },
  { id: "red", label: "Red", hex: "#D64545" },
  { id: "orange", label: "Orange", hex: "#FF8C42" },
  { id: "yellow", label: "Yellow", hex: "#FFD166" },
  { id: "cream", label: "Cream", hex: "#FFF5E0" },
  { id: "ivory", label: "Ivory", hex: "#F9F3E7" },
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "lavender", label: "Lavender", hex: "#C6A7F6" },
  { id: "purple", label: "Purple", hex: "#6E3BAC" },
  { id: "blue", label: "Blue", hex: "#5DA4F4" },

  // Greenery / foliage
  { id: "green", label: "Green", hex: "#5BAE48" },

  // Special categories
  { id: "tinted", label: "Tinted", hex: "#BDB6AC" },
  { id: "other", label: "Other", hex: "#808080" },
]

// Map for efficient color lookup by ID
export const COLOR_MAP = new Map(COLORS.map((color) => [color.id, color]))

/**
 * Get a color object by its ID
 * @param id The color ID
 * @returns The color object or undefined if not found
 */
export function getColorById(id: string): ProductColor | undefined {
  return COLOR_MAP.get(id)
}

/**
 * Get a hex value by color ID
 * @param id The color ID
 * @returns The hex value or a default dark color if not found
 */
export function getHexById(id: string): string {
  return COLOR_MAP.get(id)?.hex || "#000000"
}
