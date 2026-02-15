"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import {
  adminAddOrderItemsAction,
  adminUpdateOrderItemQuantityAction,
  deleteOrderItemAction,
} from "@/app/actions/orders"
import ProductMultiSelect from "@/components/admin/ProductMultiSelect"
import { Button } from "@/components/ui/button"
import { IconPlus, IconTrash } from "@/components/ui/icons"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import type { ProductModel } from "@/generated/models"
import { toAppErrorClient } from "@/lib/error-utils"
import type { OrderWithItems } from "@/lib/query-types"

interface AdminOrderItemsEditorProps {
  order: OrderWithItems
  products: ProductModel[]
  onItemsUpdated?: (items: OrderWithItems["items"]) => void
}

export default function AdminOrderItemsEditor({
  order,
  products,
  onItemsUpdated,
}: AdminOrderItemsEditorProps) {
  const [localItems, setLocalItems] = useState(() => order.items ?? [])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [productSelections, setProductSelections] = useState<
    { productId: string; quantity: number }[]
  >([])
  const [isPending, startTransition] = useTransition()

  const handleAddSelected = () => {
    if (productSelections.length === 0) {
      toast.error("Select at least one product to add")
      return
    }

    startTransition(async () => {
      try {
        const res = await adminAddOrderItemsAction({ orderId: order.id, items: productSelections })
        if (!res || !res.success) {
          toast.error(res?.error || "Failed to add items")
          return
        }

        const updatedOrder = res.data
        setLocalItems(updatedOrder.items ?? [])
        setSelectedIds([])
        setProductSelections([])
        onItemsUpdated?.(updatedOrder.items ?? [])
        toast.success("Items added")
      } catch (err) {
        toAppErrorClient(err, "Failed to add items")
      }
    })
  }

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
        setLocalItems(updatedOrder.items ?? [])
        onItemsUpdated?.(updatedOrder.items ?? [])
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

        // remove from local items
        setLocalItems((prev) => prev.filter((i) => i.id !== itemId))
        onItemsUpdated?.(localItems.filter((i) => i.id !== itemId))
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
          <div
            key={item.id}
            className="flex items-center justify-between p-3 border rounded-xs hover:bg-neutral-50"
          >
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">
                {item.product ? item.product.name : (item.productNameSnapshot ?? "Unknown product")}
              </p>
              <p className="text-sm text-muted-foreground">{item.product?.slug ?? ""}</p>
            </div>

            <div className="flex items-center gap-3">
              <QuantityStepper
                value={item.quantity}
                onChange={(q) => handleQuantityChange(item.id, q)}
                size="sm"
                min={0}
              />
              <Button
                size="sm"
                variant="outline-destructive"
                onClick={() =>
                  handleDelete(item.id, item.product?.name ?? item.productNameSnapshot)
                }
                disabled={isPending}
                aria-label={`Delete item ${item.product?.name ?? item.productNameSnapshot}`}
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="pt-3 border-t">
          <h3 className="font-semibold mb-3">Add products</h3>
          <ProductMultiSelect
            products={products}
            selectedIds={selectedIds}
            onChange={setSelectedIds}
            productSelections={productSelections}
            onSelectionsChange={setProductSelections}
          />

          <div className="mt-4 flex gap-2">
            <Button onClick={handleAddSelected} disabled={isPending}>
              <IconPlus className="mr-2 h-4 w-4" /> Add selected items
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedIds([])
                setProductSelections([])
              }}
            >
              Clear selection
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
