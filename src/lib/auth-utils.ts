import { auth } from "./auth"
import { db } from "./db"
import { adjustPrice } from "./utils"

/**
 * Get the current authenticated user with their approval and role status
 */
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      approved: true,
      priceMultiplier: true,
      createdAt: true,
    },
  })

  return user
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin() {
  const user = await getCurrentUser()
  return user?.role === "ADMIN"
}

/**
 * Check if the current user is approved
 */
export async function isApproved() {
  const user = await getCurrentUser()
  return user?.approved === true
}

/**
 * Get the current user's price multiplier (defaults to 1.0 for unauthenticated users)
 */
export async function getPriceMultiplier(): Promise<number> {
  const user = await getCurrentUser()
  return user?.priceMultiplier ?? 1.0
}

/**
 * Apply price multiplier to a product's variants
 */
export function applyPriceMultiplierToProduct<
  T extends { variants?: Array<{ price: number; [key: string]: unknown }> },
>(product: T, multiplier: number): T {
  if (!product.variants) return product
  return {
    ...product,
    variants: product.variants.map((variant) => ({
      ...variant,
      price: adjustPrice(variant.price, multiplier),
    })),
  }
}

/**
 * Apply price multiplier to an array of products
 */
export function applyPriceMultiplierToProducts<
  T extends { variants?: Array<{ price: number; [key: string]: unknown }> },
>(products: T[], multiplier: number): T[] {
  return products.map((product) => applyPriceMultiplierToProduct(product, multiplier))
}

/**
 * Apply price multiplier to cart items
 */
export function applyPriceMultiplierToCartItems<
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
 */
export async function getOrCreateCart() {
  const user = await getCurrentUser()
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
    cart = await db.shoppingCart.create({
      data: {
        userId: user.id,
      },
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
