import { type CountryCode, parsePhoneNumberWithError } from "libphonenumber-js"

/**
 * Format a phone number to national format (e.g., "(555) 123-4567" for US numbers)
 * Returns the input string if it cannot be parsed
 */
export function formatPhoneNumber(
  phoneInput: string | undefined | null,
  defaultCountry: string = "US"
): string {
  if (!phoneInput) return ""

  try {
    const parsed = parsePhoneNumberWithError(phoneInput, defaultCountry as CountryCode)
    if (!parsed) return phoneInput

    // Return national format for US numbers, international for others
    return parsed.format("NATIONAL")
  } catch {
    // If parsing fails, return the original input
    return phoneInput
  }
}

/**
 * Validate a phone number
 * Returns true if the number is valid for the given country
 */
export function isValidPhoneNumber(
  phoneInput: string | undefined | null,
  defaultCountry: string = "US"
): boolean {
  if (!phoneInput) return true // Allow empty phone numbers

  try {
    const parsed = parsePhoneNumberWithError(phoneInput, defaultCountry as CountryCode)
    return parsed?.isValid() ?? false
  } catch {
    return false
  }
}

/**
 * Get the country code from a phone number
 */
export function getPhoneCountryCode(
  phoneInput: string | undefined | null,
  defaultCountry: string = "US"
): string | null {
  if (!phoneInput) return null

  try {
    const parsed = parsePhoneNumberWithError(phoneInput, defaultCountry as CountryCode)
    return parsed?.country ?? null
  } catch {
    return null
  }
}
