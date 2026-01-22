"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { batchAddToCartAction } from "@/app/actions/cart"
import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth-client"
import { toAppError } from "@/lib/error-utils"
import type { SessionUser } from "@/lib/query-types"

interface AddAllToCartButtonProps {
  productIds: string[]
  quantities?: number[]
  setName?: string
  user?: SessionUser | null
}

export default function AddAllToCartButton({
  productIds,
  quantities,
  setName,
  user,
}: AddAllToCartButtonProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddAllToCart = async () => {
    if (!Array.isArray(productIds) || productIds.length === 0) {
      setError("No products to add to cart")
      toast.error("No products to add to cart")
      return
    }

    setLoading(true)
    setError(null)

    try {
      await batchAddToCartAction({ productIds, quantities: quantities ?? [] })

      toast.success(
        setName
          ? `Added all items from "${setName}" to your cart!`
          : `Added ${productIds.length} items to your cart!`
      )

      // Refresh the page to update cart count and other server components
      router.refresh()
    } catch (err) {
      toAppError(err, "Failed to add items to cart")
      setError("Failed to add items to cart")
      toast.error("Failed to add items to cart")
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
        <Button
          size="lg"
          className="w-full"
          nativeButton={false}
          render={
            <Link prefetch={false} href="/auth/signin">
              Sign in to purchase all
            </Link>
          }
        />
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
