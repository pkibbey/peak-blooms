"use client"

import { useState } from "react"
import AddAllToCartButton from "@/components/site/AddAllToCartButton"
import { ProductCard } from "@/components/site/ProductCard"
import type { ProductModel } from "@/generated/models"
import type { SessionUser } from "@/lib/query-types"

type DisplayableProduct = ProductModel & { quantity: number }

interface InspirationProductTableProps {
  products: DisplayableProduct[]
  setName: string
  user?: SessionUser | null
}

export function InspirationProductTable({ products, setName, user }: InspirationProductTableProps) {
  const [quantities, setQuantities] = useState<number[]>(products.map((p) => p.quantity))

  const handleQuantityChange = (index: number, value: number) => {
    const newQuantities = [...quantities]
    newQuantities[index] = value
    setQuantities(newQuantities)
  }

  return (
    <div className="space-y-6">
      {/* Product List */}
      <div className="grid gap-2">
        {products.map((product, index) => (
          <ProductCard
            key={product.slug}
            product={product}
            quantity={quantities[index]}
            imageSize="md"
            showQuantityControl
            showSimilarLink={false}
            user={user}
            onQuantityChange={(newValue) => handleQuantityChange(index, newValue)}
          />
        ))}
      </div>

      {/* Add All to Cart Button */}
      <div className="flex justify-end">
        <AddAllToCartButton
          productIds={products.map((p) => p.id)}
          quantities={quantities}
          setName={setName}
          user={user}
        />
      </div>
    </div>
  )
}
