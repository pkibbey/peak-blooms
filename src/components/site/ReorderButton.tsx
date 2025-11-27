"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@/components/ui/icons"

interface OrderItem {
  productId: string
  productVariantId: string | null
}

interface ReorderButtonProps {
  orderNumber: string
  items: OrderItem[]
}

export default function ReorderButton({ orderNumber, items }: ReorderButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleReorder = async () => {
    if (items.length === 0) {
      toast.error("No items to reorder")
      return
    }

    setIsLoading(true)
    try {
      const productIds = items.map((item) => item.productId)
      const productVariantIds = items.map((item) => item.productVariantId)

      const response = await fetch("/api/cart/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds, productVariantIds }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add items to cart")
      }

      toast.success(`Added ${items.length} items from order ${orderNumber} to your cart`)
      router.refresh()
      router.push("/cart")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reorder")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleReorder} disabled={isLoading}>
      <IconRefresh className="h-4 w-4 mr-2" />
      {isLoading ? "Adding..." : "Reorder"}
    </Button>
  )
}
