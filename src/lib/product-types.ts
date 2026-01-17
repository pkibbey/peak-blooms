/**
 * Product Type Constants and Utilities
 *
 * This file provides a single source of truth for product types,
 * mapping the Prisma enum to display labels.
 */

import { ProductType } from "@/generated/enums"

/**
 * Mapping of ProductType enum values to human-readable labels
 */
export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.FLOWER]: "Flower",
  [ProductType.ROSE]: "Rose",
  [ProductType.FILLER]: "Filler",
  [ProductType.PLANT]: "Plant",
  [ProductType.SUCCULENT]: "Succulent",
  [ProductType.BRANCH]: "Branch",
} as const

/**
 * Array of all valid product types
 */
export const PRODUCT_TYPES = Object.values(ProductType)
