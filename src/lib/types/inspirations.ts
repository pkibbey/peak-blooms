/**
 * Inspiration Types - Re-exported from query-types.ts for backward compatibility
 *
 * This file serves as a re-export barrel for inspiration-related types.
 * New types should be added to src/lib/query-types.ts and imported here.
 */

import type { InspirationGetPayload } from "@/generated/models"
import type { InspirationBasic, InspirationWithProducts } from "@/lib/query-types"

// Re-exports from query-types.ts
export type { InspirationBasic, InspirationWithProducts }

/** Inspiration with product count
 * @deprecated Use InspirationBasic or InspirationWithProducts from query-types.ts
 */
export type InspirationWithCount = InspirationGetPayload<{
  include: {
    _count: {
      select: { products: true }
    }
  }
}>
