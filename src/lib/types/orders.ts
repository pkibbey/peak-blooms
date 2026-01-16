/**
 * Order Types - Re-exported from query-types.ts for backward compatibility
 *
 * This file serves as a re-export barrel for order-related types.
 * New types should be added to src/lib/query-types.ts and imported here.
 */

import type { OrderGetPayload } from "@/generated/models"
import type {
  CartWithItems,
  CartWithItemsAndUser,
  OrderItemWithOrder,
  OrderItemWithProduct,
  OrderWithItems,
  OrderWithItemsAndProducts,
} from "@/lib/query-types"

// Re-exports from query-types.ts
export type {
  OrderWithItems,
  OrderWithItemsAndProducts,
  CartWithItems,
  CartWithItemsAndUser,
  OrderItemWithProduct,
  OrderItemWithOrder,
}

// Legacy type for admin order listings with count
export type OrdersWithCount = OrderGetPayload<{
  include: {
    user: { select: { id: true; email: true; name: true } }
    deliveryAddress: { select: { email: true } }
    items: { include: { product: { select: { price: true } } } }
    _count: { select: { items: true } }
  }
}>
