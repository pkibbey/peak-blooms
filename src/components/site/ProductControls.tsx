"use client"

import Link from "next/link"
import { useState } from "react"
import AddToCartButton from "@/components/site/AddToCartButton"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import type { ProductModel } from "@/generated/models"
import type { SessionUser } from "@/lib/query-types"
import { cn, formatPrice } from "@/lib/utils"

interface ProductControlsProps {
  product: ProductModel
  user?: SessionUser | null
  mode?: "card" | "detail"
}

export function ProductControls({ product, user, mode = "card" }: ProductControlsProps) {
  const isApproved = !!user?.approved
  const isSignedIn = !!user

  const [addQuantity, setAddQuantity] = useState<number>(1)

  return (
    <div className={cn("flex flex-col items-start", mode === "detail" ? "gap-6" : "gap-3")}>
      {/* Price Display */}
      {isSignedIn && isApproved && (
        <div
          className={cn("font-semibold text-primary", mode === "detail" ? "text-4xl" : "text-2xl")}
        >
          {formatPrice(product.price)}
        </div>
      )}

      {/* Unapproved User CTA - Show on detail page only */}
      {isSignedIn && !isApproved && mode === "detail" && (
        <Button
          nativeButton={false}
          render={
            <Link prefetch={false} href="/auth/signin">
              Sign in for pricing
            </Link>
          }
          size="sm"
        />
      )}

      {/* Sign in Button */}
      {!isSignedIn && (
        <Button
          nativeButton={false}
          // variant="outline"
          render={
            <Link prefetch={false} href="/auth/signin">
              Sign in for pricing
            </Link>
          }
          size="sm"
        />
      )}

      {isSignedIn && isApproved && (
        <div className={cn("flex items-center gap-2 flex-wrap", mode === "detail" ? "" : "")}>
          {/* Quantity stepper */}
          <QuantityStepper
            size={mode === "detail" ? "sm" : "xs"}
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
      )}
    </div>
  )
}
