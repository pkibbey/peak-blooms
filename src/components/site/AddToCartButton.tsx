"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { addToCartAction } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

interface AddToCartButtonProps {
  productId: string
  productName?: string
  disabled?: boolean
  quantity?: number
}

export default function AddToCartButton({
  productId,
  productName,
  disabled,
  quantity = 1,
}: AddToCartButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
