import Link from "next/link"
import { type OrderStatus, OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import { Button } from "@/components/ui/button"
import { IconEye } from "@/components/ui/icons"
import { formatDate, formatPrice } from "@/lib/utils"

interface OrderProduct {
  id: string
  name: string
}

interface OrderItemData {
  id: string
  quantity: number
  product: OrderProduct
}

interface OrderData {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  createdAt: Date
  items: OrderItemData[]
}

interface OrderCardProps {
  order: OrderData
}

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="bg-white rounded-xs shadow-sm border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg">{order.orderNumber}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.createdAt)} • {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}`}>
              <IconEye className="h-4 w-4 mr-1" />
              View Details
            </Link>
          </Button>
        </div>
      </div>

      {/* Preview of items */}
      <div className="mt-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">
          {order.items
            .slice(0, 3)
            .map((item) => item.product.name)
            .join(", ")}
          {order.items.length > 3 && ` and ${order.items.length - 3} more`}
        </p>
      </div>
    </div>
  )
}
