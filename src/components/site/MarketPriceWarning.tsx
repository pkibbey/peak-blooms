import { AlertCircle } from "lucide-react"

interface MarketPriceWarningProps {
  showWarning: boolean
  className?: string
}

/**
 * Warning component displayed when cart contains market-priced items.
 * Informs users that the final total will be higher than the displayed subtotal.
 */
export function MarketPriceWarning({ showWarning, className = "" }: MarketPriceWarningProps) {
  if (!showWarning) return null

  return (
    <div className={`rounded-md border border-muted-foreground/50 p-3 ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 items-center">
          <AlertCircle className="h-4 w-4 text-green-700/70 flex-shrink-0" />
          <h3 className="text-sm font-semibold text-muted-foreground">Market Price Items</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-normal">
          Your cart contains items with market-based pricing. The final total will be confirmed at
          before your order is dispatched.
        </p>
      </div>
    </div>
  )
}
