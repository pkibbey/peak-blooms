/**
 * CartItemForTotal: Type for items used in cart calculations
 * Minimal product info needed: price and quantity
 */
export type CartItemForTotal = {
  product?: { price: number } | null
  quantity: number
}

/**
 * Calculate cart total from items
 * Note: Assumes prices have already been adjusted by multiplier
 * Returns the subtotal, excluding market-priced items (which have 0 prices)
 */
export function calculateCartTotal(cartItems: CartItemForTotal[]) {
  const total = cartItems.reduce((sum, item) => {
    const price = item.product?.price
    // Skip market-priced items (0 prices)
    if (price === 0) return sum
    return sum + (price ?? 0) * item.quantity
  }, 0)
  // Round to 2 decimal places
  return Math.round(total * 100) / 100
}

// Helper to apply price multiplier
function adjustPriceMultiplier(price: number, multiplier: number): number {
  return Math.round(price * multiplier * 100) / 100
}

export function applyPriceMultiplierToItems<
  T extends { product?: { price: number; [key: string]: unknown } | null },
>(items: T[], multiplier: number): T[] {
  return items.map((item) => ({
    ...item,
    product: item.product
      ? {
          ...item.product,
          price: adjustPriceMultiplier(item.product.price, multiplier),
        }
      : null,
  }))
}
