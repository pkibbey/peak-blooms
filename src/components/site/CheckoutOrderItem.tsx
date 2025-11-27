import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatVariantSpecs } from "@/lib/utils"

interface CartProduct {
  id: string
  name: string
  slug: string
  image: string | null
}

interface CartVariant {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
}

interface CartItemData {
  id: string
  productId: string
  productVariantId: string | null
  quantity: number
  product: CartProduct
  productVariant: CartVariant | null
}

interface CheckoutOrderItemProps {
  item: CartItemData
}

export function CheckoutOrderItem({ item }: CheckoutOrderItemProps) {
  const price = item.productVariant?.price ?? 0
  const lineTotal = price * item.quantity
  const variantSpecs = item.productVariant
    ? formatVariantSpecs(item.productVariant.stemLength, item.productVariant.countPerBunch)
    : null

  return (
    <div className="flex gap-3">
      <div className="relative h-16 w-16 shrink-0">
        <div className="h-full w-full overflow-hidden rounded-xs bg-neutral-100">
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
        </div>
        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
          {item.quantity}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.product.name}</p>
        {variantSpecs && <p className="text-xs text-muted-foreground">{variantSpecs}</p>}
      </div>
      <p className="text-sm font-medium">{formatPrice(lineTotal)}</p>
    </div>
  )
}
