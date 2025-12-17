/**
 * Calculate cart total from items
 * Note: Assumes prices have already been adjusted by multiplier
 * Returns the subtotal, excluding market-priced items (which have null prices)
 */
export function calculateCartTotal(
  cartItems: Array<{
    product?: { price: number | null } | null
    quantity: number
  }>
) {
  const total = cartItems.reduce((sum, item) => {
    const price = item.product?.price
    // Skip market-priced items (null prices)
    if (price === null) return sum
    return sum + (price ?? 0) * item.quantity
  }, 0)
  // Round to 2 decimal places
  return Math.round(total * 100) / 100
}

/**
 * Check if a cart contains any market-priced items
 */
function hasMarketPriceItems(
  cartItems: Array<{
    product?: { price: number | null } | null
    quantity: number
  }>
): boolean {
  return cartItems.some((item) => item.product?.price === null)
}
