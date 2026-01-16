/**
 * Collection Types - Re-exported from query-types.ts for backward compatibility
 *
 * This file serves as a re-export barrel for collection-related types.
 * New types should be added to src/lib/query-types.ts and imported here.
 */

import type { CollectionGetPayload } from "@/generated/models"
import type { CollectionBasic, CollectionWithProducts } from "@/lib/query-types"

// Re-exports from query-types.ts
export type { CollectionBasic, CollectionWithProducts }

/** Basic collection including product count (_count.productCollections)
 * @deprecated Use CollectionBasic or CollectionWithProducts from query-types.ts
 */
export type CollectionBasicWithCount = CollectionGetPayload<{
  include: { _count: { select: { productCollections: true } } }
}>
