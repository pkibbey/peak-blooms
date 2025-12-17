"use client"

import { useState } from "react"
import { ProductMultiSelectItem } from "@/components/admin/ProductMultiSelectItem"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Product {
  id: string
  name: string
  price: number | null
  collection?: {
    name: string
  }
}

interface ProductSelection {
  productId: string
  quantity: number
}

interface ProductMultiSelectProps {
  products: Product[]
  selectedIds: string[]
  onChange: (selectedIds: string[]) => void
  // New props for variant selection
  productSelections?: ProductSelection[]
  onSelectionsChange?: (selections: ProductSelection[]) => void
  disabled?: boolean
}

export default function ProductMultiSelect({
  products,
  selectedIds,
  onChange,
  productSelections = [],
  onSelectionsChange,
  disabled = false,
}: ProductMultiSelectProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.collection?.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleToggle = (productId: string) => {
    if (disabled) return

    if (selectedIds.includes(productId)) {
      onChange(selectedIds.filter((id) => id !== productId))
      // Also remove from selections
      if (onSelectionsChange) {
        onSelectionsChange(productSelections.filter((s) => s.productId !== productId))
      }
    } else {
      onChange([...selectedIds, productId])
      // Add to selections
      if (onSelectionsChange) {
        onSelectionsChange([...productSelections, { productId, quantity: 1 }])
      }
    }
  }

  const handleSelectAll = () => {
    if (disabled) return
    const filteredIds = filteredProducts.map((p) => p.id)
    const newSelected = [...new Set([...selectedIds, ...filteredIds])]
    onChange(newSelected)

    // Add selections for newly added products
    if (onSelectionsChange) {
      const existingProductIds = new Set(productSelections.map((s) => s.productId))
      const newSelections: ProductSelection[] = []
      for (const p of filteredProducts) {
        if (!existingProductIds.has(p.id)) {
          newSelections.push({ productId: p.id, quantity: 1 })
        }
      }
      onSelectionsChange([...productSelections, ...newSelections])
    }
  }

  const handleDeselectAll = () => {
    if (disabled) return
    const filteredIds = new Set(filteredProducts.map((p) => p.id))
    onChange(selectedIds.filter((id) => !filteredIds.has(id)))

    // Remove from selections
    if (onSelectionsChange) {
      onSelectionsChange(productSelections.filter((s) => !filteredIds.has(s.productId)))
    }
  }

  const getSelectedQuantity = (productId: string): number => {
    const selection = productSelections.find((s) => s.productId === productId)
    return selection?.quantity ?? 1
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (disabled || !onSelectionsChange) return

    const newQuantity = Math.max(1, quantity) // Minimum of 1
    const updatedSelections = productSelections.map((s) =>
      s.productId === productId ? { ...s, quantity: newQuantity } : s
    )
    onSelectionsChange(updatedSelections)
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
        placeholder="Search products..."
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
              <ProductMultiSelectItem
                key={product.id}
                product={product}
                isSelected={selectedIds.includes(product.id)}
                selectedQuantity={getSelectedQuantity(product.id)}
                disabled={disabled}
                onToggle={handleToggle}
                onQuantityChange={onSelectionsChange ? handleQuantityChange : undefined}
              />
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
