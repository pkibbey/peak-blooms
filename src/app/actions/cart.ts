"use server"

import { revalidatePath } from "next/cache"
import { calculateCartTotal } from "@/lib/cart-utils"
import { getCurrentUser, getOrCreateCart } from "@/lib/current-user"
import { db } from "@/lib/db"

// Helper to apply price multiplier (same as in current-user.ts)
function adjustPrice(price: number, multiplier: number): number {
  return Math.round(price * multiplier * 100) / 100
}

function applyPriceMultiplier<
  T extends { product?: { price: number | null; [key: string]: unknown } | null },
>(items: T[], multiplier: number): T[] {
  return items.map((item) => ({
    ...item,
    product: item.product
      ? {
          ...item.product,
          price: item.product.price === null ? null : adjustPrice(item.product.price, multiplier),
        }
      : null,
  }))
}

/**
 * Server action to add or update item in cart
 * Returns the full cart with updated item list
 */
export async function addToCartAction(productId: string, quantity: number = 1) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")
    if (!user.approved) throw new Error("Your account is not approved for purchases")

    // Get or create cart
    let cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!cart) {
      const cartWithItems = await getOrCreateCart(user)
      if (!cartWithItems) throw new Error("Failed to get cart")
      cart = cartWithItems
    }

    if (!cart) throw new Error("Failed to get or create cart")

    // Check if product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    })
    if (!product) throw new Error("Product not found")

    // Update or create order item
    const existingItem = await db.orderItem.findFirst({
      where: { orderId: cart.id, productId },
    })

    if (existingItem) {
      await db.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity },
      })
    } else {
      await db.orderItem.create({
        data: {
          orderId: cart.id,
          productId,
          quantity,
          price: null,
        },
      })
    }

    // Fetch updated cart
    const updatedCart = await db.order.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    const adjustedItems = applyPriceMultiplier(updatedCart.items, user.priceMultiplier)
    const total = calculateCartTotal(adjustedItems)

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      status: updatedCart.status,
      notes: updatedCart.notes,
      items: adjustedItems,
      total,
    }
  } catch (error) {
    console.error("addToCartAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to add to cart")
  }
}

/**
 * Server action to update cart item quantity
 * Returns the updated cart
 */
export async function updateCartItemAction(itemId: string, quantity: number) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const item = await db.orderItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { order: true, product: true },
    })

    // Verify ownership
    if (item.order.userId !== user.id) {
      throw new Error("Unauthorized")
    }

    if (quantity <= 0) {
      // Delete if quantity is 0 or less
      await db.orderItem.delete({ where: { id: itemId } })
    } else {
      await db.orderItem.update({
        where: { id: itemId },
        data: { quantity },
      })
    }

    // Fetch updated cart
    const updatedCart = await db.order.findUniqueOrThrow({
      where: { id: item.orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    const adjustedItems = applyPriceMultiplier(updatedCart.items, user.priceMultiplier)
    const total = calculateCartTotal(adjustedItems)

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      status: updatedCart.status,
      notes: updatedCart.notes,
      items: adjustedItems,
      total,
    }
  } catch (error) {
    console.error("updateCartItemAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update cart item")
  }
}

/**
 * Server action to remove a single item from cart
 * Returns the updated cart
 */
export async function removeFromCartAction(itemId: string) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const item = await db.orderItem.findUniqueOrThrow({
      where: { id: itemId },
      include: { order: true },
    })

    // Verify ownership
    if (item.order.userId !== user.id) {
      throw new Error("Unauthorized")
    }

    // Delete the item
    await db.orderItem.delete({ where: { id: itemId } })

    // Fetch updated cart
    const updatedCart = await db.order.findUniqueOrThrow({
      where: { id: item.orderId },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    const adjustedItems = applyPriceMultiplier(updatedCart.items, user.priceMultiplier)
    const total = calculateCartTotal(adjustedItems)

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      status: updatedCart.status,
      notes: updatedCart.notes,
      items: adjustedItems,
      total,
    }
  } catch (error) {
    console.error("removeFromCartAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to remove item from cart")
  }
}

/**
 * Server action to clear all items from cart
 * Returns empty cart
 */
export async function clearCartAction() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
    })

    if (cart) {
      await db.orderItem.deleteMany({
        where: { orderId: cart.id },
      })
    }

    const updatedCart = cart || (await getOrCreateCart(user))
    if (!updatedCart) throw new Error("Failed to get cart")

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      status: updatedCart.status,
      notes: updatedCart.notes,
      items: [],
      total: 0,
    }
  } catch (error) {
    console.error("clearCartAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to clear cart")
  }
}

/**
 * Server action to fetch user's current cart
 * Does not auto-create - returns null if cart doesn't exist
 */
export async function getCartAction() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    if (!user.approved) throw new Error("Your account is not approved for purchases")

    // Get existing cart without creating one
    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!cart) return null

    const adjustedItems = applyPriceMultiplier(cart.items, user.priceMultiplier)
    const total = calculateCartTotal(adjustedItems)

    return {
      id: cart.id,
      orderNumber: cart.orderNumber,
      status: cart.status,
      notes: cart.notes,
      items: adjustedItems,
      total,
    }
  } catch (error) {
    console.error("getCartAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to fetch cart")
  }
}

/**
 * Server action to add multiple items to cart in one transaction
 * Supports single quantity for all or per-item quantities
 */
export async function batchAddToCartAction(productIds: string[], quantities?: number[] | number) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")
    if (!user.approved) throw new Error("Your account is not approved for purchases")

    if (!Array.isArray(productIds) || productIds.length === 0) {
      throw new Error("productIds must be a non-empty array")
    }

    // Determine per-item quantities
    let resolvedQuantities: number[] = []
    if (typeof quantities === "number") {
      resolvedQuantities = productIds.map(() => quantities)
    } else if (Array.isArray(quantities)) {
      if (quantities.length !== productIds.length) {
        throw new Error("quantities array length must match productIds")
      }
      resolvedQuantities = quantities.map((q) => (typeof q === "number" && q > 0 ? q : 1))
    } else {
      resolvedQuantities = productIds.map(() => 1)
    }

    // Get or create cart
    const cart = await getOrCreateCart(user)
    if (!cart) throw new Error("Failed to get or create cart")

    // Transaction to add items atomically
    await db.$transaction(async (tx) => {
      for (let i = 0; i < productIds.length; i++) {
        const productId = String(productIds[i])
        const quantity = Math.max(1, Number(resolvedQuantities[i] ?? 1))

        const existingItem = await tx.orderItem.findFirst({
          where: {
            orderId: cart.id,
            productId,
          },
        })

        if (existingItem) {
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity },
          })
        } else {
          await tx.orderItem.create({
            data: {
              orderId: cart.id,
              productId,
              quantity,
              price: null,
            },
          })
        }
      }
    })

    // Fetch updated cart
    const updatedCart = await db.order.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    const adjustedItems = applyPriceMultiplier(updatedCart.items, user.priceMultiplier)
    const total = calculateCartTotal(adjustedItems)

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      status: updatedCart.status,
      notes: updatedCart.notes,
      items: adjustedItems,
      total,
    }
  } catch (error) {
    console.error("batchAddToCartAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to add items to cart")
  }
}
