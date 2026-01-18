import Image from "next/image"
import type { CartItemData } from "@/components/site/CartItem"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/utils"

interface CheckoutOrderItemProps {
  item: CartItemData
}

export function CheckoutOrderItem({ item }: CheckoutOrderItemProps) {
  const price = item.product.price
  const lineTotal = price === 0 ? 0 : price * item.quantity

  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-16 shrink-0 rounded-xs">
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover rounded-xs"
            sizes="64px"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
          {item.quantity}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product.name}</p>
      </div>
      <p className="text-sm font-medium">{formatPrice(lineTotal)}</p>
    </div>
  )
}
