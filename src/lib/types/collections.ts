import type { CollectionGetPayload } from "@/generated/models"

/** Basic collection without relations */
export type CollectionBasic = CollectionGetPayload<Record<string, never>>

/** Basic collection including product count (_count.productCollections) */
export type CollectionBasicWithCount = CollectionGetPayload<{
  include: { _count: { select: { productCollections: true } } }
}>

/** Collection with all products */
export type CollectionWithProducts = CollectionGetPayload<{
  include: {
    productCollections: {
      include: {
        product: true
      }
    }
  }
}>
