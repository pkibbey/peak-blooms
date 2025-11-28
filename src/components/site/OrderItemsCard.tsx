import { OrderItem } from "@/components/site/OrderItem"
import { formatPrice } from "@/lib/utils"

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
  productId: string
  price: number
  quantity: number
  product: Product
  productVariant: ProductVariant | null
}

interface OrderItemsCardProps {
  items: OrderItemData[]
  total: number
  getItemLinkHref?: (item: OrderItemData) => string
}

export function OrderItemsCard({ items, total, getItemLinkHref }: OrderItemsCardProps) {
  return (
    <div className="bg-white rounded-xs shadow-sm border p-6">
      <h2 className="text-lg font-semibold font-serif mb-4">Order Items</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <OrderItem key={item.id} item={item} linkHref={getItemLinkHref?.(item)} />
        ))}
      </div>

      {/* Order Total */}
      <div className="border-t mt-4 pt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Shipping</span>
          <span className="text-muted-foreground">Calculated separately</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
