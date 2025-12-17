import type { InspirationGetPayload } from "@/generated/models"

/** Inspiration with product count */
export type InspirationWithCount = InspirationGetPayload<{
  include: {
    _count: {
      select: { products: true }
    }
  }
}>

/** Inspiration with full product details */
export type InspirationWithProducts = InspirationGetPayload<{
  include: {
    products: {
      include: {
        product: true
      }
    }
  }
}>
