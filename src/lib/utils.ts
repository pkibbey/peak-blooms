import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Price multiplier bounds for per-account pricing adjustments
 */
export const MIN_PRICE_MULTIPLIER = 0.5
export const MAX_PRICE_MULTIPLIER = 20.0

/**
 * Apply a price multiplier to a base price
 * Returns the adjusted price rounded to 2 decimal places
 * @param basePrice - The original price (null indicates market price)
 * @param multiplier - The multiplier to apply (default: 1.0)
 * @returns The adjusted price rounded to 2 decimal places, or null if basePrice is null
 */
export function adjustPrice(basePrice: number | null, multiplier: number = 1.0): number | null {
  if (basePrice === null) return null
  return Math.round(basePrice * multiplier * 100) / 100
}

/**
 * Validate that a price multiplier is within acceptable bounds
 * @param multiplier - The multiplier to validate
 * @returns True if the multiplier is valid, false otherwise
 */
export function isValidPriceMultiplier(multiplier: number): boolean {
  return (
    typeof multiplier === "number" &&
    !Number.isNaN(multiplier) &&
    multiplier >= MIN_PRICE_MULTIPLIER &&
    multiplier <= MAX_PRICE_MULTIPLIER
  )
}

/**
 * Format a number as USD currency
 * @param price - Price to format. null indicates market price.
 */
export function formatPrice(price: number | null): string {
  // If a product's price is null, it's a market price
  if (price === null) return "Market Price"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

/**
 * Format a date in medium style (e.g., "Nov 27, 2025")
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(new Date(date))
}
