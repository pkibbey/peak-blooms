"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

interface AddToCartButtonProps {
  productId: string
  productVariantId?: string | null
  productName?: string
  disabled?: boolean
  quantity?: number
}

export default function AddToCartButton({
  productId,
  productVariantId,
  productName,
  disabled,
  quantity = 1,
}: AddToCartButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddToCart = async () => {
    if (!session) {
      // Redirect to sign in if not authenticated
      router.push(`/auth/signin?callbackUrl=${window.location.pathname}`)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const raw = Number(quantity)
      const qty = Number.isNaN(raw) ? 1 : Math.max(1, Math.floor(raw))

      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          productVariantId: productVariantId || undefined,
          quantity: qty,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add to cart")
      }

      // Show success message — reflect the quantity when > 1
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        size="sm"
        className="w-full md:w-auto"
        onClick={handleAddToCart}
        disabled={loading || !!disabled}
      >
        Add to Cart
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  )
}
