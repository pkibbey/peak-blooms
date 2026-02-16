"use client"

import { useState } from "react"
import { toast } from "sonner"
import ProductMultiSelect from "@/components/admin/ProductMultiSelect"
import { Button } from "@/components/ui/button"
import { IconPlus } from "@/components/ui/icons"
import type { ProductModel } from "@/generated/models"

interface Selection {
  productId: string
  quantity: number
}

interface OrderProductsPickerProps {
  products: ProductModel[]
  onAdd: (items: Selection[]) => void | Promise<void>
  disabled?: boolean
  addButtonLabel?: string
  showHeader?: boolean
}

export default function OrderProductsPicker({
  products,
  onAdd,
  disabled = false,
  addButtonLabel = "Add selected items",
  showHeader = true,
}: OrderProductsPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [productSelections, setProductSelections] = useState<Selection[]>([])

  const handleAdd = async () => {
    if (productSelections.length === 0) {
      toast.error("Select at least one product to add")
      return
    }

    try {
      await onAdd(productSelections)
      setSelectedIds([])
      setProductSelections([])
    } catch (_err) {
      // Caller should surface errors where appropriate; show fallback toast
      toast.error("Failed to add products")
    }
  }

  return (
    <div className="pt-3 border-t">
      {showHeader && <h3 className="font-semibold mb-3">Add products</h3>}

      <ProductMultiSelect
        products={products}
        selectedIds={selectedIds}
        onChange={setSelectedIds}
        productSelections={productSelections}
        onSelectionsChange={setProductSelections}
        disabled={disabled}
      />

      <div className="mt-4 flex gap-2">
        <Button onClick={handleAdd} disabled={disabled}>
          <IconPlus className="mr-2 h-4 w-4" /> {addButtonLabel}
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
  )
}
