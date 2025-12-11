"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CartItem, type CartItemData } from "@/components/site/CartItem"
import EmptyState from "@/components/site/EmptyState"
import { Button } from "@/components/ui/button"
import { IconShoppingBag } from "@/components/ui/icons"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { formatPrice } from "@/lib/utils"

interface CartData {
  id: string
  items: CartItemData[]
  total: number
}

interface CartProps {
  initialCart: CartData
}

export default function Cart({ initialCart }: CartProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartData>(initialCart)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [isEmptying, setIsEmptying] = useState(false)

  // Debounced API call for quantity updates
  const debouncedQuantityUpdate = useDebouncedCallback(async (...args: readonly unknown[]) => {
    const itemId = args[0] as string
    const quantity = args[1] as number
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        throw new Error("Failed to update quantity")
      }

      router.refresh()
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast.error("Failed to update quantity")
      refreshCart()
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }, 800)

  const refreshCart = async () => {
    try {
      const response = await fetch("/api/cart")
      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }
      const data = await response.json()
      setCart(data)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to load cart")
    }
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    // Optimistic update - instant UI feedback
    setCart((prev) => {
      if (!prev) return prev
      const updatedItems = prev.items.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
      const newTotal = updatedItems.reduce((total, item) => {
        const price = item.product?.price ?? 0
        return total + price * item.quantity
      }, 0)
      return { ...prev, items: updatedItems, total: newTotal }
    })

    // Debounced API call
    debouncedQuantityUpdate(itemId, newQuantity)
  }

  const removeItem = async (itemId: string, productName: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    // Optimistic update
    setCart((prev) => {
      if (!prev) return prev
      const updatedItems = prev.items.filter((item) => item.id !== itemId)
      const newTotal = updatedItems.reduce((total, item) => {
        const price = item.product?.price ?? 0
        return total + price * item.quantity
      }, 0)
      return { ...prev, items: updatedItems, total: newTotal }
    })

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove item")
      }

      toast.success(`Removed "${productName}" from cart`)
      router.refresh()
    } catch (error) {
      console.error("Error removing item:", error)
      toast.error("Failed to remove item")
      // Revert on error
      refreshCart()
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
    setCart((prev) => ({ ...prev, items: [], total: 0 }))

    try {
      const response = await fetch("/api/cart", { method: "DELETE" })
      if (!response.ok) {
        throw new Error("Failed to empty cart")
      }

      toast.success("Cart cleared")
      router.refresh()
    } catch (err) {
      console.error("Error clearing cart:", err)
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
          <Button asChild>
            <Link prefetch={false} href="/shop">
              Browse Products
            </Link>
          </Button>
        }
      />
    )
  }

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
        <div className="bg-white rounded-xs shadow-sm border p-6 sticky top-24">
          <h2 className="heading-3 mb-4 font-serif">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)
              </span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Free</span>
            </div>
          </div>

          {/* Cart Total */}
          <div className="bg-neutral-50 rounded-xs p-4 mt-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total:</span>
              <span className="text-lg font-bold text-primary">{formatPrice(cart.total)}</span>
            </div>
          </div>

          <div className="border-t my-4" />

          <div className="flex justify-between font-semibold text-lg mb-6">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>

          <Button size="lg" className="w-full" asChild>
            <Link prefetch={false} href="/checkout">
              Proceed to Checkout
            </Link>
          </Button>

          <div className="mt-4">
            <Button variant="outline" asChild className="w-full">
              <Link prefetch={false} href="/shop">
                Continue Shopping
              </Link>
            </Button>
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive"
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
