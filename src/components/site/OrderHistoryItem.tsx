import { ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import ReorderButton from "@/components/site/ReorderButton"
import { calculateCartTotal } from "@/lib/cart-utils"
import type { OrderWithItems } from "@/lib/query-types"
import { formatDate, formatPrice } from "@/lib/utils"

/**
 * OrderHistoryItemProps - Uses generated types with items and products
 * Omits FK and fields not needed in UI
 * Product can be null if it was deleted after the order was placed
 */
interface OrderHistoryItemProps {
  order: OrderWithItems
}

export default function OrderHistoryItem({ order }: OrderHistoryItemProps) {
  const total = calculateCartTotal(order.items)

  return (
    <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b last:border-b-0 transition-all hover:bg-muted/40 px-3 -mx-3 rounded-xl">
      <div className="flex flex-1 items-center gap-4 min-w-0">
        {/* Order Identifier & Date */}
        <div className="flex flex-col min-w-[120px]">
          <Link
            href={`/account/order-history/${order.id}`}
            className="font-semibold text-sm hover:underline truncate"
          >
            {order.orderNumber}
          </Link>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {formatDate(order.createdAt)}
          </span>
        </div>

        {/* Item Previews - Overlapping style */}
        <div className="hidden md:flex -space-x-4 overflow-hidden py-1">
          {order.items.slice(0, 4).map((item) => {
            const productImage = item.productImageSnapshot ?? item.product?.images?.[0]
            const productName = item.productNameSnapshot ?? item.product?.name ?? "Unknown Product"

            return (
              <div
                key={item.id}
                className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-background bg-muted shadow-sm transition-transform group-hover:translate-x-1 first:group-hover:translate-x-0"
              >
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={productName}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                ) : (
                  <div className="h-full w-full bg-muted" />
                )}
              </div>
            )
          })}
          {order.items.length > 4 && (
            <div className="relative h-9 w-9 shrink-0 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold text-secondary-foreground shadow-sm transition-transform group-hover:translate-x-1">
              +{order.items.length - 4}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 shrink-0">
        {/* Status & Total */}
        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-bold tabular-nums">{formatPrice(total)}</p>
          <OrderStatusBadge
            status={order.status}
            className="text-[10px] px-2 h-5 font-bold uppercase tracking-tight"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <ReorderButton order={order} />
          <Link
            href={`/account/order-history/${order.id}`}
            className="text-muted-foreground hover:text-foreground p-1 transition-colors sm:block hidden"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
