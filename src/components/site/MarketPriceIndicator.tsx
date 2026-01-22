import { formatPrice } from "@/lib/utils"

/**
 * Market-priced total display
 * Shows formatted total price with market items indicator if applicable
 */
interface MarketPriceIndicatorProps {
  total: number
}

export function MarketPriceIndicator({ total }: MarketPriceIndicatorProps) {
  return <span>{formatPrice(total)}</span>
}
