/**
 * Test Constants - Reusable values for all test files
 * Provides valid UUIDs and other test data to maintain consistency across test suite
 */

// ============================================================================
// UUID Constants
// ============================================================================

/**
 * Valid UUID v4 format: 550e8400-e29b-41d4-a716-XXXXXXXXXXXX
 * Used for all ID-related tests to avoid Zod UUID validation errors
 */

// User IDs
export const TEST_UUID_USER_1 = "550e8400-e29b-41d4-a716-446655440001"
export const TEST_UUID_USER_2 = "550e8400-e29b-41d4-a716-446655440002"
export const TEST_UUID_ADMIN = "550e8400-e29b-41d4-a716-446655440003"

// Product IDs
export const TEST_UUID_PRODUCT_1 = "550e8400-e29b-41d4-a716-446655440011"
export const TEST_UUID_PRODUCT_2 = "550e8400-e29b-41d4-a716-446655440012"
export const TEST_UUID_PRODUCT_3 = "550e8400-e29b-41d4-a716-446655440013"

// Collection IDs
export const TEST_UUID_COLLECTION_1 = "550e8400-e29b-41d4-a716-446655440021"
export const TEST_UUID_COLLECTION_2 = "550e8400-e29b-41d4-a716-446655440022"

// Order IDs
export const TEST_UUID_ORDER_1 = "550e8400-e29b-41d4-a716-446655440031"
export const TEST_UUID_ORDER_2 = "550e8400-e29b-41d4-a716-446655440032"

// Order Item IDs
export const TEST_UUID_ORDER_ITEM_1 = "550e8400-e29b-41d4-a716-446655440041"
export const TEST_UUID_ORDER_ITEM_2 = "550e8400-e29b-41d4-a716-446655440042"

// Address IDs
export const TEST_UUID_ADDRESS_1 = "550e8400-e29b-41d4-a716-446655440051"
export const TEST_UUID_ADDRESS_2 = "550e8400-e29b-41d4-a716-446655440052"

// Session IDs (these can be simple strings, but provide UUID for consistency)
export const TEST_UUID_SESSION_1 = "550e8400-e29b-41d4-a716-446655440061"
export const TEST_UUID_SESSION_2 = "550e8400-e29b-41d4-a716-446655440062"

// Inspiration IDs
export const TEST_UUID_INSPIRATION_1 = "550e8400-e29b-41d4-a716-446655440071"

// ============================================================================
// Invalid/Test UUIDs for Error Testing
// ============================================================================

/**
 * Invalid UUID string - fails Zod uuid() validation
 * Use when testing UUID validation failures
 */
export const TEST_INVALID_UUID = "invalid-uuid-string"

/**
 * Nil UUID - all zeros
 * Use when testing with "nonexistent" or "not found" scenarios
 */
export const TEST_NONEXISTENT_UUID = "00000000-0000-0000-0000-000000000000"

// ============================================================================
// String ID Fallbacks (for non-UUID ID fields)
// ============================================================================

/**
 * Simple string IDs for fields that don't require UUID validation
 * Use these for testing user-friendly IDs like order numbers, metric IDs, etc.
 */
export const TEST_SESSION_ID = "session-1"
export const TEST_METRIC_ID = "metric-1"
export const TEST_METRIC_ID_2 = "metric-2"

// ============================================================================
// Common Test Data
// ============================================================================

export const TEST_EMAIL_ADMIN = "admin@example.com"
export const TEST_EMAIL_USER = "user@example.com"
export const TEST_EMAIL_CUSTOMER = "customer@example.com"

export const TEST_PASSWORD = "TestPassword123!"

// ============================================================================
// Mock Data Builders
// ============================================================================

/**
 * Create a set of sequential UUIDs for testing multiple items
 * @param count Number of UUIDs to generate
 * @param baseType Type of ID to generate (user, product, order, etc.)
 * @returns Array of valid UUIDs
 */
export function createTestUUIDs(count: number, baseType: string = "item"): string[] {
  const baseTypeMap: Record<string, number> = {
    user: 440001,
    product: 440011,
    collection: 440021,
    order: 440031,
    orderitem: 440041,
    address: 440051,
    session: 440061,
    inspiration: 440071,
  }

  const base = baseTypeMap[baseType] || 440001
  const uuids: string[] = []

  for (let i = 0; i < count; i++) {
    const id = String(base + i).padStart(12, "0")
    uuids.push(`550e8400-e29b-41d4-a716-${id}`)
  }

  return uuids
}

/**
 * Export all constants as a single object for convenience imports
 */
export const TEST_CONSTANTS = {
  // User IDs
  USER_1: TEST_UUID_USER_1,
  USER_2: TEST_UUID_USER_2,
  ADMIN: TEST_UUID_ADMIN,

  // Product IDs
  PRODUCT_1: TEST_UUID_PRODUCT_1,
  PRODUCT_2: TEST_UUID_PRODUCT_2,
  PRODUCT_3: TEST_UUID_PRODUCT_3,

  // Collection IDs
  COLLECTION_1: TEST_UUID_COLLECTION_1,
  COLLECTION_2: TEST_UUID_COLLECTION_2,

  // Order IDs
  ORDER_1: TEST_UUID_ORDER_1,
  ORDER_2: TEST_UUID_ORDER_2,

  // Order Item IDs
  ORDER_ITEM_1: TEST_UUID_ORDER_ITEM_1,
  ORDER_ITEM_2: TEST_UUID_ORDER_ITEM_2,

  // Address IDs
  ADDRESS_1: TEST_UUID_ADDRESS_1,
  ADDRESS_2: TEST_UUID_ADDRESS_2,

  // Session IDs
  SESSION_1: TEST_UUID_SESSION_1,
  SESSION_2: TEST_UUID_SESSION_2,

  // Inspiration IDs
  INSPIRATION_1: TEST_UUID_INSPIRATION_1,

  // Invalid UUIDs for error testing
  INVALID_UUID: TEST_INVALID_UUID,
  NONEXISTENT_UUID: TEST_NONEXISTENT_UUID,

  // String IDs
  SESSION_ID: TEST_SESSION_ID,
  METRIC_ID: TEST_METRIC_ID,
  METRIC_ID_2: TEST_METRIC_ID_2,

  // Emails
  EMAIL_ADMIN: TEST_EMAIL_ADMIN,
  EMAIL_USER: TEST_EMAIL_USER,
  EMAIL_CUSTOMER: TEST_EMAIL_CUSTOMER,

  // Password
  PASSWORD: TEST_PASSWORD,
}
