import type { OrderGetPayload } from "@/generated/models"

export type OrderWithItems = OrderGetPayload<{
  include: { items: { include: { product: true } } }
}>

export type OrdersWithCount = OrderGetPayload<{
  include: {
    user: { select: { id: true; email: true; name: true } }
    deliveryAddress: { select: { email: true } }
    items: { include: { product: { select: { price: true } } } }
    _count: { select: { items: true } }
  }
}>
