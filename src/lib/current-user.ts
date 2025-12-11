import { cache } from "react"
import { getSession } from "./auth"
import { db } from "./db"
import type { CartUser } from "./types/prisma"
import { adjustPrice } from "./utils"

/**
 * Get the current authenticated user with their approval and role status
 * Wrapped in React cache() to deduplicate calls within a single request
 *
 * Better Auth provides user data directly in the session with custom fields
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession()

  if (!session?.user?.email) {
    return null
  }

  // Return user data with custom fields from better-auth session
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    phone: (session.user.phone as string | null | undefined) ?? null,
    role: (session.user.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER",
    approved: (session.user.approved as boolean) ?? false,
    priceMultiplier: (session.user.priceMultiplier as number) ?? 1.0,
  }
})

/**
 * Apply price multiplier to cart items
 */
function applyPriceMultiplierToCartItems<
  T extends { productVariant?: { price: number; [key: string]: unknown } | null },
>(items: T[], multiplier: number): T[] {
  return items.map((item) => ({
    ...item,
    productVariant: item.productVariant
      ? {
          ...item.productVariant,
          price: adjustPrice(item.productVariant.price, multiplier),
        }
      : null,
  }))
}

/**
 * Get the current user's shopping cart (creates one if it doesn't exist)
 * Returns cart with prices adjusted by user's price multiplier
 *
 * @param existingUser - Optional: pass the user if you already have it to avoid redundant DB call
 */
export async function getOrCreateCart(existingUser?: CartUser | null) {
  const user = existingUser ?? (await getCurrentUser())
  if (!user) {
    return null
  }

  let cart = await db.shoppingCart.findUnique({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
          productVariant: true,
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

    cart = await db.shoppingCart.create({
      data: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
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
 * Calculate cart total (variant pricing required)
 * Note: Assumes prices have already been adjusted by multiplier
 */
export function calculateCartTotal(
  cartItems: Array<{
    productVariant?: { price: number } | null
    quantity: number
  }>
) {
  const total = cartItems.reduce((sum, item) => {
    const price = item.productVariant?.price ?? 0
    return sum + price * item.quantity
  }, 0)
  // Round to 2 decimal places
  return Math.round(total * 100) / 100
}
