"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProductModel } from "@/generated/models"

interface ProductMultiSelectSimpleProps {
  products: ProductModel[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  disabled?: boolean
}

export default function ProductMultiSelectSimple({
  products,
  selectedIds,
  onChange,
  disabled = false,
}: ProductMultiSelectSimpleProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return true
    const nameMatch = product.name?.toLowerCase().includes(term)
    const typeMatch = String(product.productType ?? "")
      .toLowerCase()
      .includes(term)
    return nameMatch || typeMatch
  })

  const handleToggle = (productId: string) => {
    if (disabled) return

    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId))
    } else {
      onChange([...selectedIds, productId])
    }
  }

  const handleSelectAll = () => {
    if (disabled) return
    const filteredIds = filteredProducts.map((p) => p.id)
    const newSelected = [...new Set([...selectedIds, ...filteredIds])]
    onChange(newSelected)
  }

  const handleDeselectAll = () => {
    if (disabled) return
    const filteredIds = new Set(filteredProducts.map((p) => p.id))
    onChange(selectedIds.filter((id) => !filteredIds.has(id)))
  }

  const selectedCount = selectedIds.length
  const filteredSelectedCount = filteredProducts.filter((p) => selectedIds.includes(p.id)).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedCount} product{selectedCount !== 1 ? "s" : ""} selected
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="link"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-sm"
          >
            Select visible
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDeselectAll}
            disabled={disabled}
            className="text-sm text-muted-foreground"
          >
            Deselect visible
          </Button>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Search products and types..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
        disabled={disabled}
      />

      <div className="max-h-96 overflow-y-auto rounded-md border border-border">
        {filteredProducts.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">No products found</p>
        ) : (
          <ul className="divide-y divide-border">
            {filteredProducts.map((product) => (
              <li key={product.id} className="p-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(product.id)}
                    onChange={() => handleToggle(product.id)}
                    disabled={disabled}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground/80 uppercase">
                      {product.productType}
                    </p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      {searchTerm && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
          {filteredSelectedCount > 0 && ` (${filteredSelectedCount} selected)`}
        </p>
      )}
    </div>
  )
}
