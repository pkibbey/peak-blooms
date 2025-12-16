import { cache } from "react"
import { getSession } from "./auth"
import { db } from "./db"
import type { SessionUser } from "./types/prisma"
import { adjustPrice } from "./utils"

/**
 * Get the current authenticated user with their approval and role status
 * Wrapped in React cache() to deduplicate calls within a single request
 *
 * Better Auth provides user data directly in the session with custom fields
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession()

  if (!session?.user?.email) {
    return null
  }

  // Return user data with custom fields from better-auth session
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: (session.user.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER",
    approved: (session.user.approved as boolean) ?? false,
    priceMultiplier: (session.user.priceMultiplier as number) ?? 1.0,
  }
})

/**
 * Apply price multiplier to cart items
 */
function applyPriceMultiplierToCartItems<
  T extends { product?: { price: number; [key: string]: unknown } | null },
>(items: T[], multiplier: number): T[] {
  return items.map((item) => ({
    ...item,
    product: item.product
      ? {
          ...item.product,
          price: adjustPrice(item.product.price, multiplier),
        }
      : null,
  }))
}

/**
 * Get the current user's shopping cart order (creates one if it doesn't exist)
 * Returns cart with prices adjusted by user's price multiplier
 * A cart is an Order with status = 'CART'
 *
 * @param user - pass the user if you already have it to avoid redundant DB call
 */
export async function getOrCreateCart(user: SessionUser) {
  let cart = await db.order.findFirst({
    where: { userId: user.id, status: "CART" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  if (!cart) {
    // Ensure the user still exists in the database before creating a cart.
    // A missing user would cause a FK violation (P2003) — bail out gracefully.
    const dbUser = await db.user.findUnique({ where: { id: user.id } })
    if (!dbUser) {
      console.warn(
        `getOrCreateCart: session user ${user.id} not found in database — not creating cart`
      )
      return null
    }

    // Generate order number for the new cart
    const lastOrder = await db.order.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    })

    let nextNumber = 1
    if (lastOrder?.orderNumber) {
      const match = lastOrder.orderNumber.match(/PB-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }

    const orderNumber = `PB-${nextNumber.toString().padStart(5, "0")}`

    // Create a temporary address for the cart (will be updated at checkout)
    const tempAddress = await db.address.create({
      data: {
        userId: user.id,
        firstName: "",
        lastName: "",
        company: "",
        street1: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
        phone: "",
      },
    })

    cart = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: "CART",
        total: 0,
        email: user.email,
        notes: null,
        deliveryAddressId: tempAddress.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })
  }

  // Apply user's price multiplier to cart item prices
  const multiplier = user.priceMultiplier
  const adjustedItems = applyPriceMultiplierToCartItems(cart.items, multiplier)

  return {
    ...cart,
    items: adjustedItems,
  }
}

/**
 * Calculate cart total (product pricing)
 * Note: Assumes prices have already been adjusted by multiplier
 */
export function calculateCartTotal(
  cartItems: Array<{
    product?: { price: number } | null
    quantity: number
  }>
) {
  const total = cartItems.reduce((sum, item) => {
    const price = item.product?.price ?? 0
    return sum + price * item.quantity
  }, 0)
  // Round to 2 decimal places
  return Math.round(total * 100) / 100
}
