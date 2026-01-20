"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { updateOrderStatusAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrderStatusFormProps {
  orderId: string
  currentStatus: "CART" | "PENDING" | "CONFIRMED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED"
}

const statusOptions = [
  { value: "CART", label: "Cart" },
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
]

export default function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (status === currentStatus) {
      toast.info("Status unchanged")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await updateOrderStatusAction({
        orderId,
        status: status as
          | "CART"
          | "PENDING"
          | "CONFIRMED"
          | "OUT_FOR_DELIVERY"
          | "DELIVERED"
          | "CANCELLED",
      })

      if (!res.success) {
        toast.error(res.error || "Failed to update status")
        return
      }

      toast.success("Order status updated")
      router.refresh()
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update status")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="status">Order Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as typeof currentStatus)}>
          <SelectTrigger id="status" className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectPositioner alignItemWithTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </SelectPositioner>
        </Select>
      </div>
      <Button type="submit" disabled={isSubmitting || status === currentStatus}>
        Update Status
      </Button>
    </form>
  )
}
