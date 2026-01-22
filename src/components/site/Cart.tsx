"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { clearCartAction, removeFromCartAction, updateCartItemAction } from "@/app/actions/cart"
import { CartItem } from "@/components/site/CartItem"
import EmptyState from "@/components/site/EmptyState"
import { MarketPriceIndicator } from "@/components/site/MarketPriceIndicator"
import { MarketPriceWarning } from "@/components/site/MarketPriceWarning"
import { Button } from "@/components/ui/button"
import { IconShoppingBag } from "@/components/ui/icons"
import { calculateCartTotal, calculateMinimumTotal } from "@/lib/cart-utils"
import { toAppError } from "@/lib/error-utils"
import type { CartResponse } from "@/lib/query-types"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"

interface CartProps {
  initialCart: CartResponse
}

export default function Cart({ initialCart }: CartProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartResponse>(initialCart)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [isEmptying, setIsEmptying] = useState(false)

  // Debounced server action call for quantity updates
  const debouncedQuantityUpdate = useDebouncedCallback(async (...args: readonly unknown[]) => {
    const itemId = args[0] as string
    const quantity = args[1] as number
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    try {
      const result = await updateCartItemAction({ itemId, quantity })
      if (result.success) {
        setCart(result.data)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to update quantity")
      }
    } catch (error) {
      toAppError(error, "Failed to update quantity")
      toast.error("Failed to update quantity")
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }, 800)

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    // Optimistic update - instant UI feedback
    setCart((prev) => {
      if (!prev) return prev
      const updatedItems = prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
      return { ...prev, items: updatedItems }
    })

    // Debounced server action call
    debouncedQuantityUpdate(itemId, newQuantity)
  }

  const removeItem = async (itemId: string, productName: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    // Optimistic update
    setCart((prev) => {
      if (!prev) return prev
      const updatedItems = prev.items.filter((item) => item.id !== itemId)
      return { ...prev, items: updatedItems }
    })

    try {
      const result = await removeFromCartAction({ itemId })
      if (result.success) {
        setCart(result.data)
        toast.success(`Removed "${productName}" from cart`)
        router.refresh()
      } else {
        toast.error(result.error || "Failed to remove item")
        router.refresh()
      }
    } catch (error) {
      toAppError(error, "Failed to remove item")
      toast.error("Failed to remove item")
      // Refresh to revert on error
      router.refresh()
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const emptyCart = async () => {
    if (!window.confirm("Are you sure you want to empty your cart? This will remove all items.")) {
      return
    }

    // Keep a copy in case we need to revert
    const previousCart = cart
    setIsEmptying(true)
    // Optimistic UI: clear locally first
    setCart((prev) => ({ ...prev, items: [] }))

    try {
      const result = await clearCartAction()
      if (result.success) {
        setCart(result.data)
        toast.success("Cart cleared")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to clear cart")
        setCart(previousCart)
      }
    } catch (err) {
      toAppError(err, "Failed to clear cart")
      toast.error("Failed to clear cart")
      // revert
      setCart(previousCart)
    }
    setIsEmptying(false)
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        icon={<IconShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />}
        title="Your cart is empty"
        description={"Looks like you haven't added any flowers to your cart yet."}
        primaryAction={
          <Button
            nativeButton={false}
            render={
              <Link prefetch={false} href="/shop">
                Browse Products
              </Link>
            }
          />
        }
      />
    )
  }

  const total = calculateCartTotal(cart.items)
  const minimumTotal = calculateMinimumTotal(cart.items)
  const isBelowMinimum = minimumTotal < 200

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            isUpdating={updatingItems.has(item.id)}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-background rounded-xs shadow-sm border p-6 sticky top-24">
          <h2 className="heading-3 mb-4 font-serif">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)
              </span>
              <MarketPriceIndicator total={total} />
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-muted-foreground">Free</span>
            </div>
          </div>

          <div className="border-t my-4" />

          <div className="flex justify-between font-semibold text-lg mb-4">
            <span>Total</span>
            <MarketPriceIndicator total={total} />
          </div>

          <MarketPriceWarning
            showWarning={cart.items.some((item) => item.product?.price === 0)}
            className="mb-4"
          />

          {isBelowMinimum ? (
            <div className="grid gap-3">
              <div className="text-sm text-muted-foreground text-center">
                Minimum order amount is $200.
              </div>
              <Button size="lg" className="w-full" disabled>
                Proceed to Checkout
              </Button>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full"
              nativeButton={false}
              render={
                <Link prefetch={false} href="/checkout">
                  Proceed to Checkout
                </Link>
              }
            />
          )}

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              nativeButton={false}
              render={
                <Link prefetch={false} href="/shop">
                  Continue Shopping
                </Link>
              }
            />
            <div className="mt-3">
              <Button
                variant="outline-destructive"
                size="sm"
                className="w-full"
                onClick={emptyCart}
                disabled={isEmptying}
              >
                {isEmptying ? "Clearing..." : "Empty cart"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
