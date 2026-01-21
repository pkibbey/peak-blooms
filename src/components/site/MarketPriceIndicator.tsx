import type { CartResponse } from "@/lib/query-types"
import { formatPrice } from "@/lib/utils"

/**
 * Market-priced total display
 * Shows formatted total price with market items indicator if applicable
 */
interface MarketPriceIndicatorProps {
  items: CartResponse["items"]
  total: number
  size?: "xs" | "sm"
}

export function MarketPriceIndicator({ items, total, size = "xs" }: MarketPriceIndicatorProps) {
  return <span>{formatPrice(total)}</span>
}
