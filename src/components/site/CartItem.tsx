"use client"

import { ProductItem } from "@/components/site/ProductItem"

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
  quantityPerBunch: number | null
}

export interface CartItemData {
  id: string
  productId: string
  productVariantId: string | null
  quantity: number
  product: CartProduct
  productVariant: CartVariant | null
}

interface CartItemProps {
  item: CartItemData
  isUpdating: boolean
  onUpdateQuantity: (itemId: string, newQuantity: number) => void
  onRemove: (itemId: string, productName: string) => void
}

export function CartItem({ item, isUpdating, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <ProductItem
      product={item.product}
      productVariant={item.productVariant}
      quantity={item.quantity}
      imageSize="md"
      showQuantityControl={true}
      showSimilarLink={true}
      isUpdating={isUpdating}
      onQuantityChange={(newQuantity) => onUpdateQuantity(item.id, newQuantity)}
      onRemove={() => onRemove(item.id, item.product.name)}
    />
  )
}
