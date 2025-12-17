import type { OrderGetPayload } from "@/generated/models"

export type OrderWithItems = OrderGetPayload<{
  include: { items: { include: { product: true } } }
}>
