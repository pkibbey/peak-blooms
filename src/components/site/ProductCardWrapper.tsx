"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { getCartAction, updateCartItemAction } from "@/app/actions/cart"
import { ProductItem } from "@/components/site/ProductItem"
import type { ProductModel } from "@/generated/models"
import type { CartResponse, SessionUser } from "@/lib/query-types"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"

interface ProductCardWrapperProps {
  product: ProductModel
  user?: SessionUser | null
}

export function ProductCardWrapper({ product, user }: ProductCardWrapperProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartResponse | null>(null)

  // Fetch cart on mount
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const result = await getCartAction()
        if (result.success && result.data) {
          setCart(result.data)
        }
      } catch (error) {
        console.error("Failed to fetch cart:", error)
      }
    }

    if (user) {
      fetchCart()
    }
  }, [user])

  // Find quantity of this product in cart
  const cartItem = cart?.items.find((item) => item.product.id === product.id)
  const cartItemId = cartItem?.id

  // Debounced quantity update
  const debouncedQuantityUpdate = useDebouncedCallback(async (...args: readonly unknown[]) => {
    const itemId = args[0] as string
    const quantity = args[1] as number

    try {
      const result = await updateCartItemAction({ itemId, quantity })
      if (result.success) {
        setCart(result.data)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update quantity")
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update quantity")
    }
  }, 800)

  return <ProductItem product={product} user={user} layout="grid" />
}
