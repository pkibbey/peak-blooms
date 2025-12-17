import { formatPrice } from "@/lib/utils"
import type { CartItemData } from "./CartItem"

/**
 * Market-priced total display
 * Shows formatted total price with market items indicator if applicable
 */
interface MarketPriceIndicatorProps {
  items: CartItemData[]
  total: number
  size?: "xs" | "sm"
}

export function MarketPriceIndicator({ items, total, size = "xs" }: MarketPriceIndicatorProps) {
  const hasMarketPricedItems = items.some((item) => item.product?.price === null)
  const sizeClass =
    size === "sm" ? "text-muted-foreground text-sm" : "text-muted-foreground text-xs"

  return (
    <span>
      {formatPrice(total)}
      {hasMarketPricedItems && <span className={sizeClass}> + market items</span>}
    </span>
  )
}
