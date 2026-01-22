"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { cancelOrderAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { IconRefresh, IconTrash } from "@/components/ui/icons"
import type { Order } from "@/generated/client"
import { toAppErrorClient } from "@/lib/error-utils"

interface CancelOrderButtonProps {
  order: Order
}

export function CancelOrderButton({ order }: CancelOrderButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showOptions, setShowOptions] = useState(false)

  const handleCancel = async (convertToCart: boolean) => {
    setIsLoading(true)
    try {
      const result = await cancelOrderAction({ orderId: order.id, convertToCart })

      if (result.success) {
        toast.success("Order cancelled successfully")
        setShowOptions(false)

        // Redirect based on action
        if (convertToCart) {
          router.push("/cart")
        } else {
          router.push("/account/order-history")
        }
      } else {
        toast.error(result.error || "Failed to cancel order")
      }
    } catch (_error) {
      toAppErrorClient(_error, "Failed to cancel order")
    } finally {
      setIsLoading(false)
    }
  }

  if (!showOptions) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading}
        onClick={() => setShowOptions(true)}
        className="text-destructive hover:text-destructive"
      >
        <IconTrash className="w-4 h-4 mr-2" />
        Cancel Order
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-red-50 border border-red-200 rounded-xs">
      <p className="text-sm font-medium text-red-900">Cancel Order #{order.orderNumber}?</p>
      <p className="text-xs text-red-700">Choose what you'd like to do:</p>
      <div className="flex gap-2 mt-2">
        <Button
          variant="destructive"
          size="sm"
          disabled={isLoading}
          onClick={() => handleCancel(false)}
        >
          <IconTrash className="w-4 h-4 mr-2" />
          Cancel Only
        </Button>
        <Button variant="outline" size="sm" disabled={isLoading} onClick={() => handleCancel(true)}>
          <IconRefresh className="w-4 h-4 mr-2" />
          Modify & Continue
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          onClick={() => setShowOptions(false)}
        >
          Keep Order
        </Button>
      </div>
    </div>
  )
}
