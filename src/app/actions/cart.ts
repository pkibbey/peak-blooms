"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser, getOrCreateCart, calculateCartTotal } from "@/lib/current-user"
import { db } from "@/lib/db"

export interface CartItemResponse {
  id: string
  orderId: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image: string | null
  }
}

export interface CartResponse {
  id: string
  orderNumber: string
  items: CartItemResponse[]
  total: number
  status: string
}

/**
 * Server action to add or update item in cart
 * Returns the full cart with updated item list
 */
export async function addToCartAction(
  productId: string,
  quantity: number = 1
): Promise<CartResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")
    if (!user.approved) throw new Error("Your account is not approved for purchases")

    // Get or create cart
    let cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
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
          price: 0,
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

    const total = calculateCartTotal(updatedCart.items)

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      items: updatedCart.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price * user.priceMultiplier,
          image: item.product.image,
        },
      })),
      total,
      status: updatedCart.status,
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
export async function updateCartItemAction(
  itemId: string,
  quantity: number
): Promise<CartResponse> {
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

    const total = calculateCartTotal(updatedCart.items)

    revalidatePath("/cart")
    return {
      id: updatedCart.id,
      orderNumber: updatedCart.orderNumber,
      items: updatedCart.items.map((i) => ({
        id: i.id,
        orderId: i.orderId,
        productId: i.productId,
        quantity: i.quantity,
        product: {
          id: i.product.id,
          name: i.product.name,
          price: i.product.price * user.priceMultiplier,
          image: i.product.image,
        },
      })),
      total,
      status: updatedCart.status,
    }
  } catch (error) {
    console.error("updateCartItemAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update cart item")
  }
}

/**
 * Server action to clear all items from cart
 * Returns empty cart
 */
export async function clearCartAction(): Promise<CartResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
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
      items: [],
      total: 0,
      status: updatedCart.status,
    }
  } catch (error) {
    console.error("clearCartAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to clear cart")
  }
}
