"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { addToCartAction, updateCartItemAction } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import type { ProductModel } from "@/generated/models"
import { useSession } from "@/lib/auth-client"
import { toAppErrorClient } from "@/lib/error-utils"
import type { SessionUser } from "@/lib/query-types"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { cn, formatPrice } from "@/lib/utils"

interface ProductControlsProps {
  product: ProductModel
  user?: SessionUser | null
  mode?: "card" | "detail"
  currentCartQuantity?: number
  cartItemId?: string
}

export function ProductControls({
  product,
  user,
  mode = "card",
  currentCartQuantity = 0,
  cartItemId,
}: ProductControlsProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const isApproved = !!user?.approved
  const isSignedIn = !!user

  const [addQuantity, setAddQuantity] = useState<number>(currentCartQuantity || 0)

  // Keep the local quantity in sync when product is already in cart (allows update)
  useEffect(() => {
    if (currentCartQuantity > 0) {
      setAddQuantity(currentCartQuantity)
    }
  }, [currentCartQuantity])

  // Debounced cart update function
  const debouncedUpdate = useDebouncedCallback(async (newQty: number) => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=${window.location.pathname}`)
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        const qty = Number.isNaN(newQty)
          ? 1
          : Math.max(currentCartQuantity > 0 ? 0 : 1, Math.floor(newQty))

        if (currentCartQuantity > 0 && cartItemId) {
          // Update existing cart item
          const result = await updateCartItemAction({
            itemId: cartItemId,
            quantity: qty,
          })

          if (!result.success) {
            const message = result.error || "Failed to update cart"
            setError(message)
            toast.error(message)
            return
          }

          if (qty === 0) {
            toast.success(
              product.name ? `Removed "${product.name}" from cart` : "Removed from cart"
            )
          } else {
            toast.success(
              product.name ? `Updated "${product.name}" to ${qty}` : `Updated to ${qty} items`
            )
          }
        } else {
          // Add new item to cart
          const result = await addToCartAction({ productId: product.id, quantity: qty })

          if (!result.success) {
            const message = result.error || "Failed to add to cart"
            setError(message)
            toast.error(message)
            return
          }

          toast.success(
            qty > 1
              ? product.name
                ? `Added ${qty} × "${product.name}" to cart!`
                : `Added ${qty} items to cart!`
              : product.name
                ? `Added "${product.name}" to cart!`
                : "Added to cart!"
          )
        }

        router.refresh()
      } catch (err) {
        toAppErrorClient(err, "Failed to update cart")
        setError("Failed to update cart")
        toast.error("Failed to update cart")
      }
    })
  }, 500)

  const handleQuantityChange = (newQuantity: number) => {
    setAddQuantity(newQuantity)
    debouncedUpdate(newQuantity)
  }

  return (
    <div className={cn("flex flex-col items-start", mode === "detail" ? "gap-6" : "gap-3")}>
      {/* Price Display */}
      {isSignedIn && isApproved && (
        <div
          className={cn("font-semibold text-primary", mode === "detail" ? "text-4xl" : "text-base")}
        >
          {formatPrice(product.price)}
        </div>
      )}

      {/* Unapproved User CTA - Show on detail page only */}
      {isSignedIn && !isApproved && mode === "detail" && (
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          className="text-xs"
          render={<Link href="/auth/signin">Sign in for pricing</Link>}
        />
      )}

      {/* Sign in Button */}
      {!isSignedIn && (
        <Button
          nativeButton={false}
          variant="outline"
          size="sm"
          className="text-xs"
          render={<Link href="/auth/signin">Sign in for pricing</Link>}
        />
      )}

      {isSignedIn && isApproved && (
        <div className={cn("flex items-end gap-2 flex-wrap", mode === "detail" ? "" : "")}>
          {/* Quantity stepper: min=1 for add mode, min=0 when product is in cart to allow removal */}
          <QuantityStepper
            size={mode === "detail" ? "sm" : "xs"}
            value={addQuantity}
            onChange={handleQuantityChange}
            min={currentCartQuantity > 0 ? 0 : 1}
            max={999}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      )}
    </div>
  )
}
