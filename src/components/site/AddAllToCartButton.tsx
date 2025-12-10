"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"

interface AddAllToCartButtonProps {
  productIds: string[]
  productVariantIds?: (string | null)[]
  quantities?: number[]
  setName?: string
  user?: { approved: boolean } | null
}

export default function AddAllToCartButton({
  productIds,
  productVariantIds,
  quantities,
  setName,
  user,
}: AddAllToCartButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddAllToCart = async () => {
    if (!session && !user) {
      // If session isn't available client-side and server didn't pass a user, redirect to signin
      router.push(`/auth/signin?callbackUrl=${window.location.pathname}`)
      return
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      setError("No products to add to cart")
      toast.error("No products to add to cart")
      return
    }

    setLoading(true)
    setError(null)

    try {
      type Payload = {
        productIds: string[]
        productVariantIds?: (string | null)[]
        quantities?: number[]
      }
      const payload: Payload = { productIds }
      if (Array.isArray(productVariantIds)) payload.productVariantIds = productVariantIds
      if (Array.isArray(quantities)) payload.quantities = quantities

      const response = await fetch("/api/cart/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to add items to cart")
      }

      toast.success(
        setName
          ? `Added all items from "${setName}" to your cart!`
          : `Added ${productIds.length} items to your cart!`
      )

      // Refresh the page to update cart count and other server components
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add items to cart"
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Mirror ProductConfigurator logic for showing buttons (sign in / approval / active)
  const isSignedOut = !user && !session
  const isUnapproved = (user && !user.approved) ?? false

  if (isSignedOut) {
    return (
      <>
        <Button size="lg" className="w-full" asChild>
          <Link prefetch={false} href="/auth/signin">
            Sign in to purchase all
          </Link>
        </Button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </>
    )
  }

  if (isUnapproved) {
    return (
      <>
        <Button size="lg" className="w-full" disabled>
          Waiting on Account Approval
        </Button>
        {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      </>
    )
  }

  return (
    <>
      <Button
        size="lg"
        className="w-full md:w-auto"
        onClick={handleAddAllToCart}
        disabled={loading}
      >
        Add All to Cart
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </>
  )
}
