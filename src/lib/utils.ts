import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Price multiplier bounds for per-account pricing adjustments
 */
export const MIN_PRICE_MULTIPLIER = 0.5
export const MAX_PRICE_MULTIPLIER = 2.0

/**
 * Apply a price multiplier to a base price
 * Returns the adjusted price rounded to 2 decimal places
 * @param basePrice - The original price
 * @param multiplier - The multiplier to apply (default: 1.0)
 * @returns The adjusted price rounded to 2 decimal places
 */
export function adjustPrice(basePrice: number, multiplier: number = 1.0): number {
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
 */
export function formatPrice(price: number): string {
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

/**
 * Format variant specs (stem length and count per bunch) into a display string
 * @example formatVariantSpecs(50, 10) => "50cm • 10 stems"
 * @example formatVariantSpecs(50, null) => "50cm"
 * @example formatVariantSpecs(null, 10) => "10 stems"
 */
export function formatVariantSpecs(
  stemLength: number | null | undefined,
  countPerBunch: number | null | undefined
): string {
  return [stemLength ? `${stemLength}cm` : null, countPerBunch ? `${countPerBunch} stems` : null]
    .filter(Boolean)
    .join(" • ")
}
