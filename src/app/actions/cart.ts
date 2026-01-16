"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { applyPriceMultiplierToItems, calculateCartTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import type { SessionUser } from "@/lib/types/users"
import {
  type AddToCartInput,
  addToCartSchema,
  type BatchAddToCartInput,
  batchAddToCartSchema,
  type RemoveFromCartInput,
  removeFromCartSchema,
  type UpdateCartItemInput,
  updateCartItemSchema,
} from "@/lib/validations/checkout"

/**
 * Create a new shopping cart order for the user
 * Returns cart with prices adjusted by user's price multiplier
 * A cart is an Order with status = 'CART'
 */
async function createCart(user: SessionUser) {
  const newCart = await db.order.create({
    data: {
      userId: user.id,
      status: "CART",
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  const multiplier = user.priceMultiplier ?? 1.0
  const adjustedItems = applyPriceMultiplierToItems(newCart.items, multiplier)

  return {
    ...newCart,
    items: adjustedItems,
  }
}

/**
 * Server action to add or update item in cart
 * Returns the full cart with updated item list
 */
export async function addToCartAction(input: AddToCartInput) {
  try {
    const { productId, quantity } = addToCartSchema.parse(input)
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
      cart = await createCart(user)
      if (!cart) throw new Error("Failed to create cart")
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

    const adjustedItems = applyPriceMultiplierToItems(
      updatedCart.items,
      user.priceMultiplier ?? 1.0
    )
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
    if (error instanceof ZodError) {
      const field = error.issues[0]?.path[0]
      if (field === "productId") {
        throw new Error("Product not found")
      }
      if (field === "itemId") {
        throw new Error("Order item not found")
      }
      throw new Error("Invalid product data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to add to cart")
  }
}

/**
 * Server action to update cart item quantity
 * Returns the updated cart
 */
export async function updateCartItemAction(input: UpdateCartItemInput) {
  try {
    const { itemId, quantity } = updateCartItemSchema.parse(input)
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

    const adjustedItems = applyPriceMultiplierToItems(
      updatedCart.items,
      user.priceMultiplier ?? 1.0
    )
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
    if (error instanceof ZodError) {
      throw new Error("Invalid cart item data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update cart item")
  }
}

/**
 * Server action to remove a single item from cart
 * Returns the updated cart
 */
export async function removeFromCartAction(input: RemoveFromCartInput) {
  try {
    const { itemId } = removeFromCartSchema.parse(input)
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

    const adjustedItems = applyPriceMultiplierToItems(
      updatedCart.items,
      user.priceMultiplier ?? 1.0
    )
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
    if (error instanceof ZodError) {
      throw new Error("Invalid cart item data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to remove item from cart")
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
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (cart) {
      await db.orderItem.deleteMany({
        where: { orderId: cart.id },
      })
    }

    let updatedCart = cart
    if (!updatedCart) {
      updatedCart = await createCart(user)
      if (!updatedCart) throw new Error("Failed to create cart")
    }

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

    const adjustedItems = applyPriceMultiplierToItems(cart.items, user.priceMultiplier ?? 1.0)
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
    throw new Error(error instanceof Error ? error.message : "Failed to fetch cart")
  }
}

/**
 * Server action to add multiple items to cart in one transaction
 * Supports single quantity for all or per-item quantities
 */
export async function batchAddToCartAction(input: BatchAddToCartInput) {
  try {
    const { productIds, quantities } = batchAddToCartSchema.parse(input)
    const user = await getCurrentUser()
    if (!user) throw new Error("Unauthorized")

    // Check approval after validation
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
      cart = await createCart(user)
      if (!cart) throw new Error("Failed to create cart")
    }

    // Determine per-item quantities
    let resolvedQuantities: number[] = []
    if (typeof quantities === "number") {
      resolvedQuantities = productIds.map(() => quantities)
    } else if (Array.isArray(quantities)) {
      resolvedQuantities = quantities.map((q) => (typeof q === "number" && q > 0 ? q : 1))
    } else {
      resolvedQuantities = productIds.map(() => 1)
    }

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

    const adjustedItems = applyPriceMultiplierToItems(
      updatedCart.items,
      user.priceMultiplier ?? 1.0
    )
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
    if (error instanceof ZodError) {
      throw new Error("Invalid product data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to add items to cart")
  }
}
