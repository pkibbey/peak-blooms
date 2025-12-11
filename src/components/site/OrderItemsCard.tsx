import { OrderItem } from "@/components/site/OrderItem"
import type { OrderItemModel, ProductModel } from "@/generated/models"
import { formatPrice } from "@/lib/utils"

/**
 * OrderItemsCardProps - Uses generated types with product relation
 * Omits FK and timestamp fields not needed in UI
 */
interface OrderItemsCardProps {
  items: (Omit<OrderItemModel, "orderId" | "productId"> & { product: ProductModel })[]
  total: number
}

export function OrderItemsCard({ items, total }: OrderItemsCardProps) {
  return (
    <div className="bg-background rounded-xs shadow-sm border p-6">
      <h2 className="heading-3 mb-4">Order Items</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <OrderItem key={item.id} item={item} />
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
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  )
}
