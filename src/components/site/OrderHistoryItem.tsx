import Image from "next/image"
import Link from "next/link"
import { type OrderStatus, OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import ReorderButton from "@/components/site/ReorderButton"
import type { OrderItemModel, OrderModel, ProductModel } from "@/generated/models"
import { formatDate, formatPrice } from "@/lib/utils"

/**
 * OrderHistoryItemProps - Uses generated types with items and products
 * Omits FK and fields not needed in UI
 * Product can be null if it was deleted after the order was placed
 */
interface OrderHistoryItemProps {
  order: Omit<OrderModel, "userId" | "deliveryAddressId"> & {
    items: (Omit<OrderItemModel, "orderId" | "productId"> & { product: ProductModel | null })[]
  }
}

export default function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  return (
    <div className="border-b last:border-b-0 pb-4 last:pb-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <Link
            prefetch={false}
            href={`/account/order-history/${order.id}`}
            className="font-medium hover:underline"
          >
            {order.orderNumber}
          </Link>
          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} className="text-xs" />
      </div>

      {/* Order Items Preview */}
      <div className="flex gap-1 mb-2">
        {order.items.slice(0, 5).map((item) => {
          // Use snapshot data if available (for historical accuracy), otherwise fallback to live product data
          const productImage = item.productImageSnapshot ?? item.product?.image
          const productName = item.productNameSnapshot ?? item.product?.name ?? "Unknown Product"

          return (
            <div key={item.id} className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>
          )
        })}
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
          orderStatus={order.status}
          items={order.items.map((item) => ({
            productId: item.product?.id ?? "",
            quantity: item.quantity,
          }))}
        />
      </div>
    </div>
  )
}
