import { type ClassValue, clsx } from "clsx"
import { format, isValid, parseISO } from "date-fns"
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
 * @param basePrice - The original price (0 indicates market price)
 * @param multiplier - The multiplier to apply (default: 1.0)
 * @returns The adjusted price rounded to 2 decimal places, or 0 if basePrice is 0
 */
export function adjustPrice(basePrice: number, multiplier: number = 1.0): number {
  if (basePrice === 0) return 0
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
 * @param price - Price to format. 0 indicates market price.
 */
export function formatPrice(price: number): string {
  // If a product's price is 0, it's a market price
  if (price === 0) return "Market Price"

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price)
}

/**
 * Format a date in medium style (e.g., "Nov 27, 2025")
 */
export function formatDate(date: Date | string): string {
  if (!date) return ""

  let dateObj: Date
  if (typeof date === "string") {
    dateObj = parseISO(date)
    if (!isValid(dateObj)) {
      dateObj = new Date(date)
    }
  } else {
    dateObj = date
  }

  if (!isValid(dateObj)) return ""

  return format(dateObj, "MMM d, yyyy")
}

/**
 * Build a generic friendly id from a prefix and an identifier.
 * - prefix: arbitrary string (e.g. user id)
 * - id: canonical id to derive suffix from (e.g. order id)
 * - suffixLength: number of characters from the end of `id` to include
 * - attempt: optional numeric suffix for collision retries
 *
 * Example: buildFriendlyId('user-1', '550e8400-e29b-41d4-a716-446655440001')
 *          => 'user-1-0001'
 */
export function buildFriendlyId(prefix: string, id: string, suffixLength = 4, attempt = 0) {
  const suffix = id.slice(-suffixLength)
  const base = `${prefix}-${suffix}`
  return attempt === 0 ? base : `${base}-${attempt}`
}

/**
 * Backwards-compatible order-specific helper that delegates to `buildFriendlyId`.
 * Keeps existing public API (`makeFriendlyOrderId`) while providing a reusable
 * generic implementation that can be used across other resources.
 */
export async function makeFriendlyOrderId(
  userId: string,
  orderId: string,
  attemptOrIsTaken?: number | ((candidate: string) => Promise<boolean> | boolean)
): Promise<string> {
  // If a numeric attempt is provided, just delegate to buildFriendlyId
  if (typeof attemptOrIsTaken === "number" || attemptOrIsTaken === undefined) {
    const attempt = (attemptOrIsTaken as number) || 0
    return buildFriendlyId(userId, orderId, 4, attempt)
  }

  // Otherwise treat the third arg as an `isTaken` function and retry until available
  const isTaken = attemptOrIsTaken as (candidate: string) => Promise<boolean> | boolean
  const MAX_ATTEMPTS = 100
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = buildFriendlyId(userId, orderId, 4, attempt)
    const taken = await Promise.resolve(isTaken(candidate))
    if (!taken) return candidate
  }

  throw new Error("Failed to generate unique friendlyId after maximum attempts")
}
