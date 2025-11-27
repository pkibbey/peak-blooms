"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { IconMinus, IconPlus, IconShoppingBag, IconTrash } from "../ui/icons"

interface CartProduct {
  id: string
  name: string
  slug: string
  image: string | null
}

interface CartVariant {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
}

interface CartItem {
  id: string
  productId: string
  productVariantId: string | null
  quantity: number
  product: CartProduct
  productVariant: CartVariant | null
}

interface CartData {
  id: string
  items: CartItem[]
  total: number
}

interface CartProps {
  initialCart: CartData
}

export default function Cart({ initialCart }: CartProps) {
  const router = useRouter()
  const [cart, setCart] = useState<CartData>(initialCart)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())

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
        // Variant is required for pricing
        const price = item.productVariant?.price ?? 0
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
        // Variant is required for pricing
        const price = item.productVariant?.price ?? 0
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  if (cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <IconShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">
          Looks like you haven&apos;t added any flowers to your cart yet.
        </p>
        <Button asChild>
          <Link href="/shop">Browse Products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-4">
        {cart.items.map((item) => {
          // Variant is required for pricing
          const price = item.productVariant?.price ?? 0
          const lineTotal = price * item.quantity
          const isUpdating = updatingItems.has(item.id)

          // Build variant specs string
          const variantSpecs = item.productVariant
            ? [
                item.productVariant.stemLength ? `${item.productVariant.stemLength}cm` : null,
                item.productVariant.countPerBunch
                  ? `${item.productVariant.countPerBunch} stems`
                  : null,
              ]
                .filter(Boolean)
                .join(" • ")
            : null

          return (
            <div
              key={item.id}
              className={`flex gap-4 p-4 bg-white rounded-xs shadow-sm border transition-opacity ${
                isUpdating ? "opacity-60" : ""
              }`}
            >
              {/* Product Image */}
              <Link
                href={`/shop/${item.product.slug}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xs bg-neutral-100"
              >
                {item.product.image ? (
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  // No fallback image — render an empty colored square
                  <div className="h-full w-full bg-muted" />
                )}
              </Link>

              {/* Product Details */}
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                  <div>
                    <Link
                      href={`/shop/${item.product.slug}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatPrice(price)} each
                      {variantSpecs && ` • ${variantSpecs}`}
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(lineTotal)}</p>
                </div>

                {/* View Options Link */}
                <div className="mt-2">
                  <Link
                    href={`/shop/${item.product.slug}`}
                    className="text-xs text-primary hover:underline"
                  >
                    View similar options →
                  </Link>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-end justify-between gap-4 mt-auto pt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold text-muted-foreground">Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <IconMinus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value, 10)
                          if (!Number.isNaN(newQty) && newQty >= 1) {
                            updateQuantity(item.id, newQty)
                          }
                        }}
                        disabled={isUpdating}
                        className="w-18 text-center font-medium border border-input rounded-xs px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                        aria-label="Increase quantity"
                      >
                        <IconPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(item.id, item.product.name)}
                    disabled={isUpdating}
                    aria-label={`Remove ${item.product.name} from cart`}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-white"
                  >
                    <IconTrash className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xs shadow-sm border p-6 sticky top-24">
          <h2 className="text-lg font-semibold mb-4 font-serif">Order Summary</h2>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)
              </span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Calculated at checkout</span>
            </div>
          </div>

          <div className="border-t my-4" />

          <div className="flex justify-between font-semibold text-lg mb-6">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>

          <Button size="lg" className="w-full" asChild>
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>

          <div className="mt-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
