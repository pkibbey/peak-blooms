"use client"

import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface AddToCartButtonProps {
  productId: string
  productVariantId?: string | null
  productName?: string
  disabled?: boolean
}

export default function AddToCartButton({
  productId,
  productVariantId,
  productName,
  disabled,
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
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          productVariantId: productVariantId || undefined,
          quantity: 1,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add to cart")
      }

      // Show success message
      toast.success(productName ? `Added "${productName}" to cart!` : "Added to cart!")

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
        size="lg"
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
