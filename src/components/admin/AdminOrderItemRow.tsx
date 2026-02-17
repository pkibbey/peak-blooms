"use client"

import { ProductCard } from "@/components/site/ProductCard"
import { ProductType } from "@/generated/enums"
import type { AdminOrderItem, SessionUser } from "@/lib/query-types"

interface AdminOrderItemRowProps {
  item: AdminOrderItem
  onQuantityChange: (itemId: string, newQty: number) => void
  onDelete: (itemId: string, name?: string) => void
  disabled?: boolean
  user?: SessionUser | null
}

export default function AdminOrderItemRow({
  item,
  onQuantityChange,
  onDelete,
  disabled = false,
  user = null,
}: AdminOrderItemRowProps) {
  const productForCard = {
    id: item.product?.id ?? "",
    name: item.productNameSnapshot ?? item.product?.name ?? "Unknown product",
    images: item.productImageSnapshot ? [item.productImageSnapshot] : (item.product?.images ?? []),
    price: item.price,
    slug: item.product?.slug ?? "",
    description: item.product?.description ?? null,
    colors: item.product?.colors ?? [],
    featured: item.product?.featured ?? false,
    productType: item.product?.productType ?? ProductType.FLOWER,
    createdAt: item.product?.createdAt ?? new Date(),
    updatedAt: item.product?.updatedAt ?? new Date(),
    deletedAt: item.product?.deletedAt ?? null,
  }

  const productName = productForCard.name

  return (
    <ProductCard
      product={productForCard}
      quantity={item.quantity}
      imageSize="sm"
      showQuantityControl={true}
      onQuantityChange={(q) => onQuantityChange(item.id, q)}
      onRemove={() => onDelete(item.id, productName)}
      user={user}
      isUpdating={disabled}
    />
  )
}
