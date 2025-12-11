import { ProductItem } from "@/components/site/ProductItem"
import type { OrderItemModel, ProductModel } from "@/generated/models"

/**
 * OrderItemData - Omits fields not used in UI (FK references)
 * Keeps only: id, quantity, price, product
 */
type OrderItemData = Omit<OrderItemModel, "orderId" | "productId"> & {
  product: ProductModel
}

interface OrderItemProps {
  item: OrderItemData
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <ProductItem
      product={{
        ...item.product,
        price: item.price,
      }}
      quantity={item.quantity}
      imageSize="sm"
      showQuantityControl={false}
      showSimilarLink={false}
    />
  )
}
