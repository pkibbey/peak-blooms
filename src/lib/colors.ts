/**
 * Canonical color registry for products (flowers + greenery).
 *
 * Each entry has:
 * - id: short machine id (used for lookups if desired)
 * - label: human friendly display name
 * - hex: canonical hex value to store in product.color
 * - category: 'flower' | 'greenery' | 'neutral'
 */

import { ProductType } from "@/generated/enums"

type ProductColor = {
  id: string
  label: string
  hex: string
  category: ProductType
}

export const COLORS: ProductColor[] = [
  // Flowers / warm
  { id: "coral", label: "Coral", hex: "#FF6B6B", category: ProductType.FLOWER },
  { id: "peach", label: "Peach", hex: "#F7A582", category: ProductType.FLOWER },
  { id: "blush", label: "Blush", hex: "#F4C6D7", category: ProductType.FLOWER },
  { id: "rose", label: "Rose", hex: "#F1999A", category: ProductType.FLOWER },
  { id: "pink", label: "Pink", hex: "#FF9ECF", category: ProductType.FLOWER },
  { id: "fuchsia", label: "Fuchsia", hex: "#D93B8D", category: ProductType.FLOWER },
  { id: "magenta", label: "Magenta", hex: "#C22F6D", category: ProductType.FLOWER },
  { id: "red", label: "Red", hex: "#D64545", category: ProductType.FLOWER },
  { id: "burgundy", label: "Burgundy", hex: "#7B1B2E", category: ProductType.FLOWER },
  { id: "orange", label: "Orange", hex: "#FF8C42", category: ProductType.FLOWER },
  { id: "amber", label: "Amber", hex: "#E07A5F", category: ProductType.FLOWER },
  { id: "yellow", label: "Yellow", hex: "#FFD166", category: ProductType.FLOWER },
  { id: "cream", label: "Cream", hex: "#FFF5E0", category: ProductType.FLOWER },
  { id: "ivory", label: "Ivory", hex: "#F9F3E7", category: ProductType.FLOWER },
  { id: "white", label: "White", hex: "#FFFFFF", category: ProductType.FLOWER },
  { id: "lavender", label: "Lavender", hex: "#C6A7F6", category: ProductType.FLOWER },
  { id: "purple", label: "Purple", hex: "#6E3BAC", category: ProductType.FLOWER },
  { id: "blue", label: "Blue", hex: "#5DA4F4", category: ProductType.FLOWER },
  { id: "teal", label: "Teal", hex: "#4AB5A1", category: ProductType.FLOWER },

  // Greenery / foliage
  { id: "greenery", label: "Greenery", hex: "#5BAE48", category: ProductType.FILLER },
  { id: "sage", label: "Sage", hex: "#9DBCA3", category: ProductType.FILLER },
  { id: "olive", label: "Olive", hex: "#7A8B4F", category: ProductType.FILLER },
  { id: "moss", label: "Moss", hex: "#6D8B3B", category: ProductType.FILLER },
  { id: "eucalyptus", label: "Eucalyptus", hex: "#6CA2A2", category: ProductType.FILLER },
  { id: "lime", label: "Lime", hex: "#B6E27A", category: ProductType.FILLER },
  { id: "fern", label: "Fern", hex: "#2F7A54", category: ProductType.FILLER },
  { id: "neutral", label: "Neutral", hex: "#BDB6AC", category: ProductType.FILLER },
]
