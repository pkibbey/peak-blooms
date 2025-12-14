"use client"

import { ProductItem } from "@/components/site/ProductItem"
import type { OrderItemModel, ProductModel } from "@/generated/models"

/**
 * CartItemData - Omits fields not used in UI (FK references, timestamps)
 * Keeps only: id, quantity, product
 * OrderItem represents an item in a CART order (status = 'CART')
 */
export type CartItemData = Omit<
  OrderItemModel,
  "productId" | "orderId" | "price" | "createdAt" | "updatedAt"
> & {
  product: ProductModel
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
      quantity={item.quantity}
      imageSize="md"
      showQuantityControl
      showSimilarLink
      isUpdating={isUpdating}
      onQuantityChange={(newQuantity) => onUpdateQuantity(item.id, newQuantity)}
      onRemove={() => onRemove(item.id, item.product.name)}
    />
  )
}
