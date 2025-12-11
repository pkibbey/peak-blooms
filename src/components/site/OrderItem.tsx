import { ProductItem } from "@/components/site/ProductItem"

interface Product {
  id: string
  name: string
  slug: string
  image: string | null
  price: number
}

interface OrderItemData {
  id: string
  price: number
  quantity: number
  product: Product
}

interface OrderItemProps {
  item: OrderItemData
}

export function OrderItem({ item }: OrderItemProps) {
  return (
    <ProductItem
      product={{
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        image: item.product.image,
        price: item.price,
      }}
      quantity={item.quantity}
      imageSize="sm"
      showQuantityControl={false}
      showSimilarLink={false}
    />
  )
}
