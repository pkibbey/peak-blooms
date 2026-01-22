"use client"

import { useState } from "react"
import { toast } from "sonner"
import { updateOrderItemPriceAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toAppErrorClient } from "@/lib/error-utils"
import type { OrderWithItems } from "@/lib/query-types"
import { formatPrice } from "@/lib/utils"

interface AdminOrderPriceEditorProps {
  order: OrderWithItems
  onPriceUpdated?: (newTotal: number) => void
}

/**
 * Admin component to edit individual order item prices and see total recalculation
 * Used for setting market-priced items that have 0 prices at checkout
 */
export function AdminOrderPriceEditor({ order, onPriceUpdated }: AdminOrderPriceEditorProps) {
  const { id: orderId, items } = order
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingPrice, setEditingPrice] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const [itemPrices, setItemPrices] = useState<Record<string, number>>(() => {
    const prices: Record<string, number> = {}
    for (const item of items) {
      prices[item.id] = item.price
    }
    return prices
  })

  const handleEditClick = (itemId: string, currentPrice: number) => {
    setEditingItemId(itemId)
    setEditingPrice(currentPrice?.toString() || "")
  }

  const handleSavePrice = async (itemId: string) => {
    if (!editingPrice || Number.isNaN(parseFloat(editingPrice))) {
      toast.error("Please enter a valid price")
      return
    }

    const newPrice = parseFloat(editingPrice)

    setIsSaving(true)
    try {
      const result = await updateOrderItemPriceAction({ orderId, itemId, price: newPrice })

      if (!result.success) {
        toast.error(result.error || "Failed to update price")
        return
      }

      // Update local state
      setItemPrices((prev) => ({ ...prev, [itemId]: newPrice }))
      setEditingItemId(null)
      setEditingPrice("")

      // Recalculate total
      const newTotal = result.data.orderTotal
      onPriceUpdated?.(newTotal)

      toast.success("Price updated successfully")
    } catch (error) {
      toAppErrorClient(error, "Failed to update price")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingItemId(null)
    setEditingPrice("")
  }

  // Calculate current total from item prices
  const currentTotal = items.reduce((sum, item) => {
    const price = itemPrices[item.id]
    if (price === 0) return sum // Skip 0 prices
    return sum + (price ?? 0) * item.quantity
  }, 0)

  const hasMarketPriceItems = items.some((item) => itemPrices[item.id] === 0)

  return (
    <div className="bg-background rounded-xs shadow-sm border p-6">
      <h2 className="heading-3 mb-4">Order Items - Edit Prices</h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 border rounded-xs hover:bg-neutral-50"
          >
            <div className="flex-1">
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
            </div>

            {editingItemId === item.id ? (
              <div className="flex gap-2 ml-4">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingPrice}
                  onChange={(e) => setEditingPrice(e.target.value)}
                  placeholder="Price"
                  className="w-24"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleSavePrice(item.id)}
                  disabled={isSaving}
                  className="whitespace-nowrap"
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 ml-4">
                <div className="text-right w-24">
                  <p className="font-medium">
                    {itemPrices[item.id] === 0
                      ? "Market Price"
                      : formatPrice(itemPrices[item.id] ?? 0)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditClick(item.id, itemPrices[item.id])}
                >
                  Edit
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Order Total */}
      <div className="border-t mt-4 pt-4">
        {hasMarketPriceItems && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded text-sm text-orange-900">
            <strong>Note:</strong> This order contains market-priced items. Set their prices above
            to finalize the order total.
          </div>
        )}

        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Subtotal</span>
          <span>
            {formatPrice(currentTotal)}
            {hasMarketPriceItems && (
              <span className="text-muted-foreground text-xs ml-1"> + market items</span>
            )}
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Delivery</span>
          <span className="text-green-600 font-medium">Free</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-2 border-t">
          <span>Total</span>
          <span>
            {formatPrice(currentTotal)}
            {hasMarketPriceItems && (
              <span className="text-muted-foreground text-sm ml-1"> + market items</span>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
