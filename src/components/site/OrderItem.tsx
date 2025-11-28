import Image from "next/image"
import Link from "next/link"
import { formatPrice, formatVariantSpecs } from "@/lib/utils"

interface Product {
  id: string
  name: string
  image: string | null
}

interface ProductVariant {
  id: string
  stemLength: number | null
  countPerBunch: number | null
}

interface OrderItemData {
  id: string
  price: number
  quantity: number
  product: Product
  productVariant: ProductVariant | null
}

interface OrderItemProps {
  item: OrderItemData
  linkHref?: string
}

export function OrderItem({ item, linkHref }: OrderItemProps) {
  const lineTotal = item.price * item.quantity
  const variantSpecs = item.productVariant
    ? formatVariantSpecs(item.productVariant.stemLength, item.productVariant.countPerBunch)
    : null

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xs bg-neutral-100">
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex justify-between">
          <div>
            {linkHref ? (
              <Link href={linkHref} className="font-medium hover:text-primary hover:underline">
                {item.product.name}
              </Link>
            ) : (
              <p className="font-medium">{item.product.name}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {formatPrice(item.price)} × {item.quantity}
              {variantSpecs && ` • ${variantSpecs}`}
            </p>
          </div>
          <p className="font-medium">{formatPrice(lineTotal)}</p>
        </div>
      </div>
    </div>
  )
}
