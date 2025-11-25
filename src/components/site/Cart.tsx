"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useDebouncedCallback } from "@/lib/useDebouncedCallback"

interface CartProduct {
  id: string
  name: string
  slug: string
  price: number
  imageUrl: string | null
}

interface CartVariant {
  id: string
  name: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
}

interface ProductVariant {
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

export default function Cart() {
  const router = useRouter()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const [variantsCache, setVariantsCache] = useState<Record<string, ProductVariant[]>>({})

  // Debounced API call for quantity updates
  const debouncedQuantityUpdate = useDebouncedCallback(
    async (itemId: string, quantity: number) => {
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
        fetchCart()
      } finally {
        setUpdatingItems((prev) => {
          const next = new Set(prev)
          next.delete(itemId)
          return next
        })
      }
    },
    800
  )

  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch("/api/cart")
      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }
      const data = await response.json()
      setCart(data)
      
      // Preload variants for all products in cart
      data.items.forEach((item: CartItem) => {
        if (!variantsCache[item.productId]) {
          fetchVariants(item.productId)
        }
      })
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast.error("Failed to load cart")
    } finally {
      setLoading(false)
    }
  }

  const fetchVariants = async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/variants`)
      if (!response.ok) {
        throw new Error("Failed to fetch variants")
      }
      const variants = await response.json()
      setVariantsCache((prev) => ({ ...prev, [productId]: variants }))
    } catch (error) {
      console.error("Error fetching variants:", error)
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
        const price = item.productVariant?.price ?? item.product.price
        return total + price * item.quantity
      }, 0)
      return { ...prev, items: updatedItems, total: newTotal }
    })

    // Debounced API call
    debouncedQuantityUpdate(itemId, newQuantity)
  }

  const updateVariant = async (itemId: string, newVariantId: string | null) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    // Find the new variant to update price optimistically
    const cartItem = cart?.items.find((item) => item.id === itemId)
    if (!cartItem) return

    const newVariant = variantsCache[cartItem.productId]?.find(
      (v) => v.id === newVariantId
    )

    // Optimistic update
    setCart((prev) => {
      if (!prev) return prev
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            productVariantId: newVariantId,
            productVariant: newVariant
              ? { ...newVariant, name: "" }
              : null,
          }
        }
        return item
      })
      const newTotal = updatedItems.reduce((total, item) => {
        const price = item.productVariant?.price ?? item.product.price
        return total + price * item.quantity
      }, 0)
      return { ...prev, items: updatedItems, total: newTotal }
    })

    try {
      const response = await fetch(`/api/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productVariantId: newVariantId }),
      })

      if (!response.ok) {
        throw new Error("Failed to update variant")
      }

      toast.success("Variant updated")
      router.refresh()
    } catch (error) {
      console.error("Error updating variant:", error)
      toast.error("Failed to update variant")
      // Revert on error
      fetchCart()
    } finally {
      setUpdatingItems((prev) => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  const removeItem = async (itemId: string, productName: string) => {
    setUpdatingItems((prev) => new Set(prev).add(itemId))

    // Optimistic update
    setCart((prev) => {
      if (!prev) return prev
      const updatedItems = prev.items.filter((item) => item.id !== itemId)
      const newTotal = updatedItems.reduce((total, item) => {
        const price = item.productVariant?.price ?? item.product.price
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
      fetchCart()
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

  const getProductImage = (item: CartItem) => {
    // Use imageUrl from product if available, otherwise fallback to a default placeholder
    if (item.product.imageUrl) {
      return item.product.imageUrl
    }
    // Fallback to a default placeholder
    return "/products/pink-rose.jpg"
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading cart...</div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
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
          const price = item.productVariant?.price ?? item.product.price
          const lineTotal = price * item.quantity
          const isUpdating = updatingItems.has(item.id)
          const variants = variantsCache[item.productId] || []

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
                <Image
                  src={getProductImage(item)}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
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
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(lineTotal)}</p>
                </div>

                {/* Variant Selectors */}
                {variants.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    {/* Stem Length Selector */}
                    {variants.some((v) => v.stemLength !== null) && (() => {
                      const uniqueStemLengths = Array.from(
                        new Set(variants.map((v) => v.stemLength).filter((l): l is number => l !== null))
                      ).sort((a, b) => a - b)
                      
                      // Get current variant's stem length
                      const currentVariant = variants.find((v) => v.id === item.productVariantId)
                      const currentStemLength = currentVariant?.stemLength?.toString() || uniqueStemLengths[0]?.toString() || ""
                      
                      return (
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Stem Length
                          </Label>
                          <Select
                            value={currentStemLength}
                            onValueChange={(newStemLength) => {
                              // Find variant with this stem length and current count per bunch
                              const currentCount = currentVariant?.countPerBunch
                              const matchingVariant = variants.find(
                                (v) => v.stemLength?.toString() === newStemLength && 
                                       (currentCount === null || v.countPerBunch === currentCount)
                              ) || variants.find((v) => v.stemLength?.toString() === newStemLength)
                              
                              if (matchingVariant) {
                                updateVariant(item.id, matchingVariant.id)
                              }
                            }}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {uniqueStemLengths.map((length) => (
                                <SelectItem key={length} value={length.toString()}>
                                  {length}cm
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })()}

                    {/* Count Per Bunch Selector */}
                    {variants.some((v) => v.countPerBunch !== null) && (() => {
                      const uniqueCounts = Array.from(
                        new Set(variants.map((v) => v.countPerBunch).filter((c): c is number => c !== null))
                      ).sort((a, b) => a - b)
                      
                      // Get current variant's count per bunch
                      const currentVariant = variants.find((v) => v.id === item.productVariantId)
                      const currentCount = currentVariant?.countPerBunch?.toString() || uniqueCounts[0]?.toString() || ""
                      
                      return (
                        <div>
                          <Label className="text-xs font-semibold text-muted-foreground mb-1 block">
                            Count Per Bunch
                          </Label>
                          <Select
                            value={currentCount}
                            onValueChange={(newCount) => {
                              // Find variant with this count and current stem length
                              const currentStemLength = currentVariant?.stemLength
                              const matchingVariant = variants.find(
                                (v) => v.countPerBunch?.toString() === newCount && 
                                       (currentStemLength === null || v.stemLength === currentStemLength)
                              ) || variants.find((v) => v.countPerBunch?.toString() === newCount)
                              
                              if (matchingVariant) {
                                updateVariant(item.id, matchingVariant.id)
                              }
                            }}
                            disabled={isUpdating}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {uniqueCounts.map((count) => (
                                <SelectItem key={count} value={count.toString()}>
                                  {count} stems
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="flex items-end justify-between gap-4 mt-auto pt-2">
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs font-semibold text-muted-foreground">
                      Quantity
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value, 10)
                          if (!isNaN(newQty) && newQty >= 1) {
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
                        <Plus className="h-4 w-4" />
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
                    <Trash2 className="h-4 w-4 mr-1" />
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

          <Button
            size="lg"
            className="w-full"
            disabled
            title="Checkout coming soon"
          >
            Checkout coming soon
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
