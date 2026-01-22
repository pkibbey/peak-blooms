"use client"

import { useState } from "react"
import { toast } from "sonner"
import { batchAddToCartAction } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@/components/ui/icons"
import { toAppErrorClient } from "@/lib/error-utils"
import type { OrderWithItems } from "@/lib/query-types"

interface ReorderButtonProps {
  order: OrderWithItems
  onPriceUpdated?: (newTotal: number) => void
}

export default function ReorderButton({ order }: ReorderButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Can only reorder if order is NOT in PENDING, CONFIRMED, or OUT_FOR_DELIVERY status
  const canReorder = !["PENDING", "CONFIRMED", "OUT_FOR_DELIVERY"].includes(order.status)

  const handleReorder = async () => {
    if (order.items.length === 0) {
      toast.error("No items to reorder")
      return
    }

    setIsLoading(true)
    try {
      const items = order.items.filter((item) => item.productId) as OrderWithItems["items"]
      const productIds = items.map((item: (typeof items)[0]) => item.productId)
      const quantities = items.map((item: (typeof items)[0]) =>
        Math.max(1, Number(item.quantity || 1))
      )

      if (productIds.length === 0) {
        toast.error("No available products to reorder")
        return
      }

      await batchAddToCartAction({ productIds, quantities })

      const totalUnits = quantities.reduce((s: number, q: number) => s + q, 0)
      toast.success(
        `Added ${totalUnits} item${totalUnits !== 1 ? "s" : ""} from order ${order.orderNumber} to your cart`
      )
      // Use full page navigation to ensure cart state is updated on client and server
      window.location.href = "/cart"
    } catch (error) {
      toAppErrorClient(error, "Failed to reorder")
    } finally {
      setIsLoading(false)
    }
  }

  if (!canReorder) {
    return null
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReorder} disabled={isLoading}>
      <IconRefresh className="h-4 w-4 mr-2" />
      {isLoading ? "Adding..." : "Reorder"}
    </Button>
  )
}
