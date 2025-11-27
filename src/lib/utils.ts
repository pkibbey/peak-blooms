import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
