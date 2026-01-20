import { ProductCard } from "@/components/site/ProductCard"
import { ProductType } from "@/generated/enums"
import type { OrderItemModel, ProductModel } from "@/generated/models"

/**
 * OrderItemData - Omits fields not used in UI (FK references)
 * Keeps only: id, quantity, price, product, and snapshot fields
 * Prefers snapshot data over live product data for historical accuracy
 */
type OrderItemData = Omit<OrderItemModel, "orderId" | "productId"> & {
  product: ProductModel | null
}

interface OrderItemProps {
  item: OrderItemData
}

export function OrderItem({ item }: OrderItemProps) {
  // Use snapshot data if available (for historical accuracy), otherwise fallback to live product data
  const productName = item.productNameSnapshot ?? item.product?.name ?? "Unknown Product"
  const productImage = item.productImageSnapshot ?? item.product?.images?.[0] ?? null

  return (
    <ProductCard
      product={{
        id: item.product?.id ?? "",
        name: productName,
        images: productImage ? [productImage] : [],
        price: item.price,
        slug: item.product?.slug ?? "",
        description: item.product?.description ?? null,
        colors: item.product?.colors ?? [],
        featured: item.product?.featured ?? false,
        productType: item.product?.productType ?? ProductType.FLOWER,
        createdAt: item.product?.createdAt ?? new Date(),
        updatedAt: item.product?.updatedAt ?? new Date(),
        deletedAt: item.product?.deletedAt ?? null,
      }}
      quantity={item.quantity}
      imageSize="sm"
      showQuantityControl={false}
      showSimilarLink={false}
    />
  )
}
