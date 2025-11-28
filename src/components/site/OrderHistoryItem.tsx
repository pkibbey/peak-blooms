import Image from "next/image"
import Link from "next/link"
import { type OrderStatus, OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import ReorderButton from "@/components/site/ReorderButton"
import { formatDate, formatPrice } from "@/lib/utils"

interface OrderItem {
  id: string
  productId: string
  productVariantId: string | null
  product: {
    name: string
    image: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: Date
  items: OrderItem[]
}

interface OrderHistoryItemProps {
  order: Order
}

export default function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  return (
    <div className="border-b last:border-b-0 pb-4 last:pb-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
            {order.orderNumber}
          </Link>
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} className="text-xs" />
      </div>

      {/* Order Items Preview */}
      <div className="flex gap-1 mb-2">
        {order.items.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs bg-neutral-100"
          >
            {item.product.image ? (
              <Image
                src={item.product.image}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        ))}
        {order.items.length > 5 && (
          <div className="h-12 w-12 shrink-0 rounded-xs bg-neutral-100 flex items-center justify-center text-xs text-muted-foreground">
            +{order.items.length - 5}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{formatPrice(order.total)}</p>
        <ReorderButton
          orderNumber={order.orderNumber}
          items={order.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
          }))}
        />
      </div>
    </div>
  )
}
