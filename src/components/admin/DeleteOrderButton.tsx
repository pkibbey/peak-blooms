"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { deleteOrderAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { IconTrash } from "@/components/ui/icons"
import { toAppErrorClient } from "@/lib/error-utils"

interface DeleteOrderButtonProps {
  orderId: string
  hasAttachments?: boolean
}

export function DeleteOrderButton({ orderId, hasAttachments = false }: DeleteOrderButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = () => {
    if (hasAttachments) {
      toast.error("This order has invoices attached. Delete invoices before deleting the order.")
      return
    }

    if (!confirm("Delete this order? This action cannot be undone.")) return

    startTransition(async () => {
      try {
        const res = await deleteOrderAction({ orderId })
        if (!res || !res.success) {
          toast.error(res?.error || "Failed to delete order")
          return
        }

        toast.success("Order deleted")
        router.push("/admin/orders")
        router.refresh()
      } catch (err) {
        toAppErrorClient(err, "Failed to delete order")
      }
    })
  }

  return (
    <Button size="sm" variant="outline-destructive" onClick={handleDelete} disabled={isPending}>
      <IconTrash className="h-4 w-4 mr-1" />
      Delete
    </Button>
  )
}
