"use client"

import { useState } from "react"
import AddAllToCartButton from "@/components/site/AddAllToCartButton"
import { Button } from "@/components/ui/button"
import { IconMinus, IconPlus } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"

interface InspirationQuantitySelectorProps {
  productIds: string[]
  productVariantIds: (string | null)[]
  defaultQuantities: number[]
  setName: string
  user?: { approved: boolean } | null
}

export function InspirationQuantitySelector({
  productIds,
  productVariantIds,
  defaultQuantities,
  setName,
  user,
}: InspirationQuantitySelectorProps) {
  const [quantities, setQuantities] = useState<number[]>(defaultQuantities)

  const handleQuantityChange = (index: number, value: number) => {
    const clamped = Math.max(1, Math.min(999, value))
    const newQuantities = [...quantities]
    newQuantities[index] = clamped
    setQuantities(newQuantities)
  }

  const handleDecrement = (index: number) => {
    setQuantities((prev) => {
      const newQuantities = [...prev]
      newQuantities[index] = Math.max(1, newQuantities[index] - 1)
      return newQuantities
    })
  }

  const handleIncrement = (index: number) => {
    setQuantities((prev) => {
      const newQuantities = [...prev]
      newQuantities[index] = Math.min(999, newQuantities[index] + 1)
      return newQuantities
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {productIds.map((productId) => {
          const index = productIds.indexOf(productId)
          return (
            <div
              key={productId}
              className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-md"
            >
              <span className="text-sm font-medium">Product {index + 1}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleDecrement(index)}
                  aria-label="Decrease quantity"
                >
                  <IconMinus className="h-3 w-3" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={quantities[index]}
                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10) || 1)}
                  className="w-12 h-8 text-center text-xs px-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => handleIncrement(index)}
                  aria-label="Increase quantity"
                >
                  <IconPlus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>

      <AddAllToCartButton
        productIds={productIds}
        productVariantIds={productVariantIds}
        quantities={quantities}
        setName={setName}
        user={user}
      />
    </div>
  )
}
