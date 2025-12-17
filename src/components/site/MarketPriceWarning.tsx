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
    <div className={`rounded-lg border border-orange-200 bg-orange-50 p-4 ${className}`}>
      <div className="flex gap-3">
        <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-orange-900">Market Price Items in Your Cart</h3>
          <p className="text-sm text-orange-800 mt-1">
            Your cart contains items with market-based pricing. The final total will be confirmed at
            the time of delivery and may be higher than the subtotal shown above.
          </p>
        </div>
      </div>
    </div>
  )
}
