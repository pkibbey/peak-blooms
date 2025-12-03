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
  category: "flower" | "greenery" | "neutral"
}

export const COLORS: ProductColor[] = [
  // Flowers / warm
  { id: "coral", label: "Coral", hex: "#FF6B6B", category: "flower" },
  { id: "peach", label: "Peach", hex: "#F7A582", category: "flower" },
  { id: "blush", label: "Blush", hex: "#F4C6D7", category: "flower" },
  { id: "rose", label: "Rose", hex: "#F1999A", category: "flower" },
  { id: "pink", label: "Pink", hex: "#FF9ECF", category: "flower" },
  { id: "fuchsia", label: "Fuchsia", hex: "#D93B8D", category: "flower" },
  { id: "magenta", label: "Magenta", hex: "#C22F6D", category: "flower" },
  { id: "red", label: "Red", hex: "#D64545", category: "flower" },
  { id: "burgundy", label: "Burgundy", hex: "#7B1B2E", category: "flower" },
  { id: "orange", label: "Orange", hex: "#FF8C42", category: "flower" },
  { id: "amber", label: "Amber", hex: "#E07A5F", category: "flower" },
  { id: "yellow", label: "Yellow", hex: "#FFD166", category: "flower" },
  { id: "cream", label: "Cream", hex: "#FFF5E0", category: "flower" },
  { id: "ivory", label: "Ivory", hex: "#F9F3E7", category: "flower" },
  { id: "white", label: "White", hex: "#FFFFFF", category: "neutral" },
  { id: "lavender", label: "Lavender", hex: "#C6A7F6", category: "flower" },
  { id: "purple", label: "Purple", hex: "#6E3BAC", category: "flower" },
  { id: "blue", label: "Blue", hex: "#5DA4F4", category: "flower" },
  { id: "teal", label: "Teal", hex: "#4AB5A1", category: "flower" },

  // Greenery / foliage
  { id: "greenery", label: "Greenery", hex: "#5BAE48", category: "greenery" },
  { id: "sage", label: "Sage", hex: "#9DBCA3", category: "greenery" },
  { id: "olive", label: "Olive", hex: "#7A8B4F", category: "greenery" },
  { id: "moss", label: "Moss", hex: "#6D8B3B", category: "greenery" },
  { id: "eucalyptus", label: "Eucalyptus", hex: "#6CA2A2", category: "greenery" },
  { id: "lime", label: "Lime", hex: "#B6E27A", category: "greenery" },
  { id: "fern", label: "Fern", hex: "#2F7A54", category: "greenery" },
  { id: "neutral", label: "Neutral", hex: "#BDB6AC", category: "neutral" },
]
