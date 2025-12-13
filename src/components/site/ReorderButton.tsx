"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@/components/ui/icons"

interface OrderItem {
  productId: string
  quantity: number
}

interface ReorderButtonProps {
  orderNumber: string
  items: OrderItem[]
  orderStatus: string
}

export default function ReorderButton({ orderNumber, items, orderStatus }: ReorderButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Can only reorder if order is NOT in PENDING, CONFIRMED, or OUT_FOR_DELIVERY status
  const canReorder = !["PENDING", "CONFIRMED", "OUT_FOR_DELIVERY"].includes(orderStatus)

  const handleReorder = async () => {
    if (items.length === 0) {
      toast.error("No items to reorder")
      return
    }

    setIsLoading(true)
    try {
      const productIds = items.map((item) => item.productId)
      const quantities = items.map((item) => Math.max(1, Number(item.quantity || 1)))

      const response = await fetch("/api/cart/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, quantities }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add items to cart")
      }

      const totalUnits = quantities.reduce((s, q) => s + q, 0)
      toast.success(
        `Added ${totalUnits} item${totalUnits !== 1 ? "s" : ""} from order ${orderNumber} to your cart`
      )
      // Use full page navigation to ensure cart state is updated on client and server
      window.location.href = "/cart"
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reorder")
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
