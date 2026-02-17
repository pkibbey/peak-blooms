"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath } from "next/cache"
import { applyPriceMultiplierToItems, calculateCartTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import type { CartResponse, CartWithItems, SessionUser } from "@/lib/query-types"
import { makeFriendlyOrderId } from "@/lib/utils"
import {
  addToCartSchema,
  batchAddToCartSchema,
  removeFromCartSchema,
  updateCartItemSchema,
} from "@/lib/validations/checkout"
import { wrapAction } from "@/server/error-handler"

/**
 * Create a new shopping cart order for the user
 * Returns cart with prices adjusted by user's price multiplier
 * A cart is an Order with status = 'CART'
 */
async function createCart(user: SessionUser): Promise<CartWithItems | null> {
  // Prisma now requires `friendlyId` at create time. Use a unique temporary
  // placeholder and immediately replace it with the deterministic value once
  // we have the order id.
  const tempFriendly = `tmp-${randomUUID()}`

  const newCart = await db.order.create({
    data: {
      userId: user.id,
      status: "CART",
      friendlyId: tempFriendly,
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      attachments: true,
    },
  })

  if (!newCart) return null

  // Persist a deterministic friendlyId: <userId>-<4charsOfOrderId>
  // makeFriendlyOrderId will retry with attempt suffixes until an unused value is found.
  const friendly = await makeFriendlyOrderId(user.id, newCart.id, async (candidate) =>
    Boolean(await db.order.findUnique({ where: { friendlyId: candidate } }))
  )

  // Persist friendlyId but continue using the object returned from create()
  await db.order.update({ where: { id: newCart.id }, data: { friendlyId: friendly } })

  const cartWithFriendly = { ...newCart, friendlyId: friendly }
  const multiplier = user.priceMultiplier ?? 1.0
  const adjustedItems = applyPriceMultiplierToItems(
    cartWithFriendly.items,
    multiplier
  ) as unknown as CartWithItems["items"]

  return {
    ...cartWithFriendly,
    items: adjustedItems,
  }
}

/**
 * Sort cart items by product name
 */
function sortCartItems<T extends { product?: { name: string } | null }>(
  items: T[]
): Array<T & { product: NonNullable<T["product"]> }> {
  // Filter out any items that are missing product snapshots then sort
  const filtered = items.filter((i): i is T & { product: NonNullable<T["product"]> } =>
    Boolean(i.product)
  )
  return filtered.sort((a, b) => a.product.name.localeCompare(b.product.name))
}

/**
 * Server action to add or update item in cart
 * Returns AppResult with full cart or error details
 */
export const addToCartAction = wrapAction(async (input: unknown): Promise<CartResponse> => {
  // 1. Validate input
  const { productId, quantity } = addToCartSchema.parse(input)

  // 2. Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: You must be logged in to add items to cart")
  }

  // 3. Check account approval
  if (!user.approved) {
    throw new Error("Forbidden: Your account is not approved for purchases")
  }

  // 4. Check product exists
  const product = await db.product.findUnique({
    where: { id: productId },
  })
  if (!product) {
    throw new Error("Product not found")
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
      throw new Error("Failed to create cart")
    }
  }

  // Ensure cart has a persisted friendlyId (handle legacy/missing rows)
  if (cart && !cart.friendlyId) {
    const generatedFriendly = await makeFriendlyOrderId(user.id, cart.id, async (candidate) =>
      Boolean(await db.order.findUnique({ where: { friendlyId: candidate } }))
    )
    await db.order.update({ where: { id: cart.id }, data: { friendlyId: generatedFriendly } })
    cart = { ...cart, friendlyId: generatedFriendly }
  }

  // 6. Update or create order item
  const existingItem = await db.orderItem.findFirst({
    where: { orderId: cart.id, productId },
  })

  if (existingItem) {
    // Increment existing item quantity instead of replacing it. Also ensure quantity is at least 1.
    const newQuantity = Math.max(1, existingItem.quantity + (quantity ?? 1))
    await db.orderItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    })
  } else {
    await db.orderItem.create({
      data: {
        orderId: cart.id,
        productId,
        quantity: Math.max(1, quantity ?? 1),
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

  const adjustedItems = applyPriceMultiplierToItems(updatedCart.items, user.priceMultiplier ?? 1.0)
  const sortedItems = sortCartItems(adjustedItems)
  const total = calculateCartTotal(sortedItems)

  revalidatePath("/cart")
  return {
    id: updatedCart.id,
    friendlyId: updatedCart.friendlyId,
    status: updatedCart.status,
    notes: updatedCart.notes,
    items: sortedItems,
    total,
  }
})

/**
 * Server action to update cart item quantity
 * Returns AppResult with updated cart or error details
 */
export const updateCartItemAction = wrapAction(async (input: unknown): Promise<CartResponse> => {
  // 1. Validate input
  const { itemId, quantity } = updateCartItemSchema.parse(input)

  // 2. Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: You must be logged in")
  }

  // 3. Fetch item with order
  const item = await db.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true, product: true },
  })

  if (!item) {
    throw new Error("Cart item not found")
  }

  // 4. Verify ownership
  if (item.order.userId !== user.id) {
    throw new Error("Forbidden: You cannot modify this cart")
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

  const adjustedItems = applyPriceMultiplierToItems(updatedCart.items, user.priceMultiplier ?? 1.0)
  const sortedItems = sortCartItems(adjustedItems)
  const total = calculateCartTotal(sortedItems)

  revalidatePath("/cart")
  return {
    id: updatedCart.id,
    friendlyId: updatedCart.friendlyId,
    status: updatedCart.status,
    notes: updatedCart.notes,
    items: sortedItems,
    total,
  }
})

/**
 * Server action to remove a single item from cart
 * Returns AppResult with updated cart or error details
 */
export const removeFromCartAction = wrapAction(async (input: unknown): Promise<CartResponse> => {
  // 1. Validate input
  const { itemId } = removeFromCartSchema.parse(input)

  // 2. Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: You must be logged in")
  }

  // 3. Fetch item with order
  const item = await db.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true },
  })

  if (!item) {
    throw new Error("Cart item not found")
  }

  // 4. Verify ownership
  if (item.order.userId !== user.id) {
    throw new Error("Forbidden: You cannot modify this cart")
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

  const adjustedItems = applyPriceMultiplierToItems(updatedCart.items, user.priceMultiplier ?? 1.0)
  const sortedItems = sortCartItems(adjustedItems)
  const total = calculateCartTotal(sortedItems)

  revalidatePath("/cart")
  return {
    id: updatedCart.id,
    friendlyId: updatedCart.friendlyId,
    status: updatedCart.status,
    notes: updatedCart.notes,
    items: sortedItems,
    total,
  }
})

/**
 * Server action to clear all items from cart
 * Returns AppResult with empty cart or error details
 */
export const clearCartAction = wrapAction(async (): Promise<CartResponse> => {
  // 1. Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("You must be logged in")
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
      throw new Error("Failed to create cart")
    }
  }

  revalidatePath("/cart")
  return {
    id: updatedCart.id,
    friendlyId: updatedCart.friendlyId,
    status: updatedCart.status,
    notes: updatedCart.notes,
    items: [],
    total: 0,
  }
})

/**
 * Server action to fetch user's current cart
 * Does not auto-create - returns null if cart doesn't exist
 */
export const getCartAction = wrapAction(async (): Promise<CartResponse | null> => {
  // 1. Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: You must be logged in")
  }

  // 2. Check approval
  if (!user.approved) {
    throw new Error("Forbidden: Your account is not approved for purchases")
  }

  // 3. Get existing cart without creating one
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
    return null
  }

  // Ensure cart has a persisted friendlyId (handle legacy/missing rows)
  if (!cart.friendlyId) {
    const generatedFriendly = await makeFriendlyOrderId(user.id, cart.id, async (candidate) =>
      Boolean(await db.order.findUnique({ where: { friendlyId: candidate } }))
    )
    await db.order.update({ where: { id: cart.id }, data: { friendlyId: generatedFriendly } })
    cart = { ...cart, friendlyId: generatedFriendly }
  }

  // 4. Return cart with adjusted prices
  const adjustedItems = applyPriceMultiplierToItems(cart.items, user.priceMultiplier ?? 1.0)
  const sortedItems = sortCartItems(adjustedItems)
  const total = calculateCartTotal(sortedItems)

  return {
    id: cart.id,
    friendlyId: cart.friendlyId,
    status: cart.status,
    notes: cart.notes,
    items: sortedItems,
    total,
  }
})

/**
 * Server action to add multiple items to cart in one transaction
 * Supports single quantity for all or per-item quantities
 */
export const batchAddToCartAction = wrapAction(async (input: unknown): Promise<CartResponse> => {
  // 1. Validate input
  const { productIds, quantities } = batchAddToCartSchema.parse(input)

  // 2. Check authentication
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized: You must be logged in to add items to cart")
  }

  // 3. Check approval
  if (!user.approved) {
    throw new Error("Forbidden: Your account is not approved for purchases")
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
      throw new Error("Failed to create cart")
    }
  }

  // Ensure cart has a persisted friendlyId (handle legacy/missing rows)
  if (cart && !cart.friendlyId) {
    const generatedFriendly = await makeFriendlyOrderId(user.id, cart.id, async (candidate) =>
      Boolean(await db.order.findUnique({ where: { friendlyId: candidate } }))
    )
    await db.order.update({ where: { id: cart.id }, data: { friendlyId: generatedFriendly } })
    cart = { ...cart, friendlyId: generatedFriendly }
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
        // Increment existing item quantity instead of replacing it. Also ensure quantity is at least 1.
        const newQuantity = Math.max(1, existingItem.quantity + (quantity ?? 1))
        await tx.orderItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        })
      } else {
        await tx.orderItem.create({
          data: {
            orderId: cart.id,
            productId,
            quantity: Math.max(1, quantity ?? 1),
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

  const adjustedItems = applyPriceMultiplierToItems(updatedCart.items, user.priceMultiplier ?? 1.0)
  const sortedItems = sortCartItems(adjustedItems)
  const total = calculateCartTotal(sortedItems)

  revalidatePath("/cart")
  return {
    id: updatedCart.id,
    friendlyId: updatedCart.friendlyId,
    status: updatedCart.status,
    notes: updatedCart.notes,
    items: sortedItems,
    total,
  }
})
