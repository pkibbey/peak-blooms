"use server"

import { revalidatePath } from "next/cache"
import { applyPriceMultiplierToItems, calculateCartTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, CartResponse, SessionUser } from "@/lib/query-types"
import {
  addToCartSchema,
  batchAddToCartSchema,
  removeFromCartSchema,
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

  if (!newCart) return null

  const multiplier = user.priceMultiplier ?? 1.0
  const adjustedItems = applyPriceMultiplierToItems(newCart.items, multiplier)

  return {
    ...newCart,
    items: adjustedItems,
  }
}

/**
 * Server action to add or update item in cart
 * Returns AppResult with full cart or error details
 */
export async function addToCartAction(input: unknown): Promise<AppResult<CartResponse>> {
  try {
    // 1. Validate input
    const { productId, quantity } = addToCartSchema.parse(input)

    // 2. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to add items to cart",
        code: "UNAUTHORIZED",
      }
    }

    // 3. Check account approval
    if (!user.approved) {
      return {
        success: false,
        error: "Your account is not approved for purchases",
        code: "FORBIDDEN",
      }
    }

    // 4. Check product exists
    const product = await db.product.findUnique({
      where: { id: productId },
    })
    if (!product) {
      return {
        success: false,
        error: "Product not found",
        code: "NOT_FOUND",
      }
    }

    // 5. Get or create cart
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
      if (!cart) {
        return {
          success: false,
          error: "Failed to create cart",
          code: "SERVER_ERROR",
        }
      }
    }

    // 6. Update or create order item
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

    // 7. Fetch and return updated cart
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
      success: true,
      data: {
        id: updatedCart.id,
        orderNumber: updatedCart.orderNumber,
        status: updatedCart.status,
        notes: updatedCart.notes,
        items: adjustedItems,
        total,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to add item to cart")
  }
}

/**
 * Server action to update cart item quantity
 * Returns AppResult with updated cart or error details
 */
export async function updateCartItemAction(input: unknown): Promise<AppResult<CartResponse>> {
  try {
    // 1. Validate input
    const { itemId, quantity } = updateCartItemSchema.parse(input)

    // 2. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in",
        code: "UNAUTHORIZED",
      }
    }

    // 3. Fetch item with order
    const item = await db.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true, product: true },
    })

    if (!item) {
      return {
        success: false,
        error: "Cart item not found",
        code: "NOT_FOUND",
      }
    }

    // 4. Verify ownership
    if (item.order.userId !== user.id) {
      return {
        success: false,
        error: "You cannot modify this cart",
        code: "FORBIDDEN",
      }
    }

    // 5. Delete if quantity <= 0, otherwise update
    if (quantity <= 0) {
      await db.orderItem.delete({
        where: { id: itemId },
      })
    } else {
      await db.orderItem.update({
        where: { id: itemId },
        data: { quantity },
      })
    }

    // 6. Fetch and return updated cart
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
      success: true,
      data: {
        id: updatedCart.id,
        orderNumber: updatedCart.orderNumber,
        status: updatedCart.status,
        notes: updatedCart.notes,
        items: adjustedItems,
        total,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to update cart item")
  }
}

/**
 * Server action to remove a single item from cart
 * Returns AppResult with updated cart or error details
 */
export async function removeFromCartAction(input: unknown): Promise<AppResult<CartResponse>> {
  try {
    // 1. Validate input
    const { itemId } = removeFromCartSchema.parse(input)

    // 2. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in",
        code: "UNAUTHORIZED",
      }
    }

    // 3. Fetch item with order
    const item = await db.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    })

    if (!item) {
      return {
        success: false,
        error: "Cart item not found",
        code: "NOT_FOUND",
      }
    }

    // 4. Verify ownership
    if (item.order.userId !== user.id) {
      return {
        success: false,
        error: "You cannot modify this cart",
        code: "FORBIDDEN",
      }
    }

    // 5. Delete the item
    await db.orderItem.delete({ where: { id: itemId } })

    // 6. Fetch and return updated cart
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
      success: true,
      data: {
        id: updatedCart.id,
        orderNumber: updatedCart.orderNumber,
        status: updatedCart.status,
        notes: updatedCart.notes,
        items: adjustedItems,
        total,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to remove item from cart")
  }
}

/**
 * Server action to clear all items from cart
 * Returns AppResult with empty cart or error details
 */
export async function clearCartAction(): Promise<AppResult<CartResponse>> {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in",
        code: "UNAUTHORIZED",
      }
    }

    // 2. Get existing cart
    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    // 3. Clear items if cart exists
    if (cart) {
      await db.orderItem.deleteMany({
        where: { orderId: cart.id },
      })
    }

    // 4. Return empty cart
    let updatedCart = cart
    if (!updatedCart) {
      updatedCart = await createCart(user)
      if (!updatedCart) {
        return {
          success: false,
          error: "Failed to create cart",
          code: "SERVER_ERROR",
        }
      }
    }

    revalidatePath("/cart")
    return {
      success: true,
      data: {
        id: updatedCart.id,
        orderNumber: updatedCart.orderNumber,
        status: updatedCart.status,
        notes: updatedCart.notes,
        items: [],
        total: 0,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to clear cart")
  }
}

/**
 * Server action to fetch user's current cart
 * Does not auto-create - returns null if cart doesn't exist
 */
export async function getCartAction(): Promise<AppResult<CartResponse | null>> {
  try {
    // 1. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in",
        code: "UNAUTHORIZED",
      }
    }

    // 2. Check approval
    if (!user.approved) {
      return {
        success: false,
        error: "Your account is not approved for purchases",
        code: "FORBIDDEN",
      }
    }

    // 3. Get existing cart without creating one
    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: { product: true },
        },
      },
    })

    if (!cart) {
      return { success: true, data: null }
    }

    // 4. Return cart with adjusted prices
    const adjustedItems = applyPriceMultiplierToItems(cart.items, user.priceMultiplier ?? 1.0)
    const total = calculateCartTotal(adjustedItems)

    return {
      success: true,
      data: {
        id: cart.id,
        orderNumber: cart.orderNumber,
        status: cart.status,
        notes: cart.notes,
        items: adjustedItems,
        total,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to fetch cart")
  }
}

/**
 * Server action to add multiple items to cart in one transaction
 * Supports single quantity for all or per-item quantities
 */
export async function batchAddToCartAction(input: unknown): Promise<AppResult<CartResponse>> {
  try {
    // 1. Validate input
    const { productIds, quantities } = batchAddToCartSchema.parse(input)

    // 2. Check authentication
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to add items to cart",
        code: "UNAUTHORIZED",
      }
    }

    // 3. Check approval
    if (!user.approved) {
      return {
        success: false,
        error: "Your account is not approved for purchases",
        code: "FORBIDDEN",
      }
    }

    // 4. Get or create cart
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
      if (!cart) {
        return {
          success: false,
          error: "Failed to create cart",
          code: "SERVER_ERROR",
        }
      }
    }

    // 5. Determine per-item quantities
    let resolvedQuantities: number[] = []
    if (typeof quantities === "number") {
      resolvedQuantities = productIds.map(() => quantities)
    } else if (Array.isArray(quantities)) {
      resolvedQuantities = quantities
    } else {
      resolvedQuantities = productIds.map(() => 1)
    }

    // 6. Transaction to add items atomically
    await db.$transaction(async (tx) => {
      for (let i = 0; i < productIds.length; i++) {
        const productId = String(productIds[i])
        const quantity = resolvedQuantities[i] ?? 1

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
              price: 0,
            },
          })
        }
      }
    })

    // 7. Fetch and return updated cart
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
      success: true,
      data: {
        id: updatedCart.id,
        orderNumber: updatedCart.orderNumber,
        status: updatedCart.status,
        notes: updatedCart.notes,
        items: adjustedItems,
        total,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to add items to cart")
  }
}
