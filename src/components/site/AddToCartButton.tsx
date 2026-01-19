"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addToCartAction } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import { QuantityStepper } from "@/components/ui/QuantityStepper"
import { useSession } from "@/lib/auth-client"

interface AddToCartButtonProps {
  productId: string
  productName?: string
  disabled?: boolean
  quantity?: number
  currentQuantity?: number // Current quantity in cart (0 if not in cart)
  onQuantityChange?: (newQuantity: number) => void // Callback when quantity is updated
}

export default function AddToCartButton({
  productId,
  productName,
  disabled,
  quantity = 1,
  currentQuantity = 0,
  onQuantityChange,
}: AddToCartButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [updateQuantity, setUpdateQuantity] = useState<number>(currentQuantity)

  // In update mode
  const isInCart = currentQuantity > 0

  const handleAddToCart = () => {
    if (!session) {
      // Redirect to sign in if not authenticated
      router.push(`/auth/signin?callbackUrl=${window.location.pathname}`)
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        const raw = Number(quantity)
        const qty = Number.isNaN(raw) ? 1 : Math.max(1, Math.floor(raw))

        await addToCartAction({ productId, quantity: qty })

        // Show success message - reflect the quantity when > 1
        if (qty > 1) {
          toast.success(
            productName ? `Added ${qty} × "${productName}" to cart!` : `Added ${qty} items to cart!`
          )
        } else {
          toast.success(productName ? `Added "${productName}" to cart!` : "Added to cart!")
        }

        // Refresh the page to update cart count and other server components
        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add to cart"
        setError(message)
        toast.error(message)
      }
    })
  }

  const handleUpdateQuantity = (newQuantity: number) => {
    setUpdateQuantity(newQuantity)
    if (onQuantityChange) {
      onQuantityChange(newQuantity)
    }
  }

  // Show "Add" mode with quantity stepper
  if (!isInCart) {
    return (
      <>
        <Button
          size="icon-xs"
          className="w-full md:w-auto px-2"
          onClick={handleAddToCart}
          disabled={isPending || !!disabled}
        >
          Add
        </Button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </>
    )
  }

  // Show "Update" mode with quantity display and stepper
  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Display quantity badge */}
        <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded text-sm font-medium">
          <span className="text-xs text-muted-foreground">Selected:</span>
          <span className="text-primary">{updateQuantity}</span>
        </div>
        {/* Quantity stepper for updates */}
        <QuantityStepper
          size="xs"
          value={updateQuantity}
          onChange={handleUpdateQuantity}
          min={1}
          max={999}
          disabled={isPending || !!disabled}
        />
        <Button
          size="icon-xs"
          className="w-full md:w-auto px-2"
          disabled={isPending || !!disabled}
          onClick={() => {
            // Trigger a server refresh to reflect changes
            router.refresh()
          }}
        >
          Update
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  )
}
