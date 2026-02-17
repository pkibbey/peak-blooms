"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  adminAddOrderItemsAction,
  adminUpdateOrderItemQuantityAction,
  deleteOrderItemAction,
} from "@/app/actions/orders"
import AdminOrderItemRow from "@/components/admin/AdminOrderItemRow"
import OrderProductsPicker from "@/components/admin/OrderProductsPicker"
import type { ProductModel } from "@/generated/models"
import { toAppErrorClient } from "@/lib/error-utils"
import type { AdminOrderItem, OrderWithItems, SessionUser } from "@/lib/query-types"

interface AdminOrderItemsEditorProps {
  order: OrderWithItems
  products: ProductModel[]
  onItemsUpdated?: (items: AdminOrderItem[]) => void
  user?: SessionUser | null
}

export default function AdminOrderItemsEditor({
  order,
  products,
  onItemsUpdated,
  user = null,
}: AdminOrderItemsEditorProps) {
  const sortItemsByName = (items: AdminOrderItem[] = []) =>
    [...items].sort((a, b) => {
      const aName = (a.product?.name ?? a.productNameSnapshot ?? "").toLowerCase()
      const bName = (b.product?.name ?? b.productNameSnapshot ?? "").toLowerCase()
      return aName.localeCompare(bName)
    })

  const [localItems, setLocalItems] = useState<AdminOrderItem[]>(() =>
    sortItemsByName(order.items ?? [])
  )
  const [isPending, startTransition] = useTransition()

  const handleQuantityChange = (itemId: string, newQty: number) => {
    startTransition(async () => {
      try {
        const res = await adminUpdateOrderItemQuantityAction({
          orderId: order.id,
          itemId,
          quantity: newQty,
        })
        if (!res || !res.success) {
          toast.error(res?.error || "Failed to update quantity")
          return
        }

        const updatedOrder = res.data
        const sorted = sortItemsByName(updatedOrder.items ?? [])
        setLocalItems(sorted)
        onItemsUpdated?.(sorted)
        toast.success("Quantity updated")
      } catch (err) {
        toAppErrorClient(err, "Failed to update quantity")
      }
    })
  }

  const handleDelete = (itemId: string, name?: string) => {
    if (!confirm(`Delete "${name ?? "item"}"? This cannot be undone.`)) return

    startTransition(async () => {
      try {
        const res = await deleteOrderItemAction({ orderId: order.id, itemId })
        if (!res || !res.success) {
          toast.error(res?.error || "Failed to delete item")
          return
        }

        // remove from local items and notify parent with the updated array (avoid stale closure)
        setLocalItems((prev) => {
          const next = prev.filter((i) => i.id !== itemId)
          const sorted = sortItemsByName(next)
          onItemsUpdated?.(sorted)
          return sorted
        })
        toast.success("Item removed")
      } catch (err) {
        toAppErrorClient(err, "Failed to delete item")
      }
    })
  }

  return (
    <div className="bg-background rounded-xs shadow-sm border p-6">
      <h2 className="heading-3 mb-4">Order Items — Edit</h2>

      <div className="space-y-4">
        {localItems.map((item) => (
          <AdminOrderItemRow
            key={item.id}
            item={item}
            onQuantityChange={handleQuantityChange}
            onDelete={handleDelete}
            disabled={isPending}
            user={user}
          />
        ))}

        <OrderProductsPicker
          products={products}
          onAdd={(items) => {
            startTransition(async () => {
              try {
                const res = await adminAddOrderItemsAction({ orderId: order.id, items })
                if (!res || !res.success) {
                  toast.error(res?.error || "Failed to add items")
                  return
                }

                const updatedOrder = res.data
                const sorted = sortItemsByName(updatedOrder.items ?? [])
                setLocalItems(sorted)
                onItemsUpdated?.(sorted)
                toast.success("Items added")
              } catch (err) {
                toAppErrorClient(err, "Failed to add items")
              }
            })
          }}
          disabled={isPending}
        />
      </div>
    </div>
  )
}
