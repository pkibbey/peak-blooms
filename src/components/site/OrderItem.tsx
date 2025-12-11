import { ProductItem } from "@/components/site/ProductItem"

interface Product {
  id: string
  name: string
  slug: string
  image: string | null
}

interface ProductVariant {
  id: string
  stemLength: number | null
  quantityPerBunch: number | null
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
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <ProductItem
      product={item.product}
      productVariant={
        item.productVariant
          ? {
              id: item.productVariant.id,
              price: item.price,
              stemLength: item.productVariant.stemLength,
              quantityPerBunch: item.productVariant.quantityPerBunch,
            }
          : null
      }
      quantity={item.quantity}
      imageSize="sm"
      showQuantityControl={false}
      showSimilarLink={false}
    />
  )
}
