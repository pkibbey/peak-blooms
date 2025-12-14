"use client"

import Link from "next/link"
import { useState } from "react"
import AddToCartButton from "@/components/site/AddToCartButton"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import { cn, formatPrice } from "@/lib/utils"

interface Product {
  id: string
  name: string
  price: number
}

interface ProductControlsProps {
  product: Product
  user?: {
    approved: boolean
  } | null
  mode?: "card" | "detail"
}

export function ProductControls({ product, user, mode = "card" }: ProductControlsProps) {
  const isUnapproved = user && !user.approved
  const isSignedOut = !user

  const [addQuantity, setAddQuantity] = useState<number>(1)

  if (isSignedOut && isUnapproved) {
    return null
  }

  return (
    <div className={cn("flex flex-col", mode === "detail" ? "gap-6" : "gap-3")}>
      {/* Price Display */}
      {isSignedOut && !isUnapproved && (
        <div
          className={cn("font-semibold text-primary", mode === "detail" ? "text-4xl" : "text-2xl")}
        >
          {formatPrice(product.price)}
        </div>
      )}

      {/* Add to Cart Button */}
      {isSignedOut ? (
        <Button
          className="w-full"
          nativeButton={false}
          render={
            <Link prefetch={false} href="/auth/signin">
              Sign in to view pricing
            </Link>
          }
        />
      ) : (
        !isUnapproved && (
          <div className={cn("flex items-center gap-2 flex-wrap", mode === "detail" ? "" : "")}>
            {/* Quantity stepper */}
            <QuantityStepper
              size="xs"
              value={addQuantity}
              onChange={setAddQuantity}
              min={1}
              max={999}
            />

            <AddToCartButton
              productId={product.id}
              quantity={addQuantity}
              productName={product.name}
            />
          </div>
        )
      )}
    </div>
  )
}
