/**
 * Test Helpers for Type-Safe Mock Creation
 *
 * Provides factories for creating consistent mock objects in tests.
 * Ensures test data matches runtime types and is easy to override.
 */

import type { Role } from "@/generated/enums"
import { Role as RoleEnum } from "@/generated/enums"
import type { SessionUser } from "@/lib/query-types"

/**
 * Create a mock SessionUser for testing
 * Provides sensible defaults and allows overriding specific fields
 *
 * @param overrides - Partial SessionUser to override defaults
 * @returns Complete SessionUser mock
 */
export function mockSessionUser(overrides?: Partial<SessionUser>): SessionUser {
  return {
    id: "test-user-id",
    email: "test@example.com",
    approved: true,
    role: RoleEnum.CUSTOMER,
    priceMultiplier: 1.0,
    ...overrides,
  }
}

/**
 * Create a mock admin SessionUser for testing
 * Identical to mockSessionUser but with ADMIN role
 *
 * @param overrides - Partial SessionUser to override defaults
 * @returns Complete admin SessionUser mock
 */
export function mockAdminUser(overrides?: Partial<SessionUser>): SessionUser {
  return mockSessionUser({
    role: RoleEnum.ADMIN,
    ...overrides,
  })
}

/**
 * Create a mock unapproved SessionUser for testing
 * Identical to mockSessionUser but with approved: false
 *
 * @param overrides - Partial SessionUser to override defaults
 * @returns Complete unapproved SessionUser mock
 */
export function mockUnapprovedUser(overrides?: Partial<SessionUser>): SessionUser {
  return mockSessionUser({
    approved: false,
    ...overrides,
  })
}

/**
 * Create a mock SessionUser with custom role
 * Useful for testing different permission levels
 *
 * @param role - The role for the mock user
 * @param overrides - Additional fields to override
 * @returns SessionUser with specified role
 */
export function mockUserWithRole(role: Role, overrides?: Partial<SessionUser>): SessionUser {
  return mockSessionUser({
    role,
    ...overrides,
  })
}

/**
 * Create a mock SessionUser with custom price multiplier
 * Useful for testing price calculations
 *
 * @param multiplier - The price multiplier
 * @param overrides - Additional fields to override
 * @returns SessionUser with specified multiplier
 */
export function mockUserWithMultiplier(
  multiplier: number,
  overrides?: Partial<SessionUser>
): SessionUser {
  return mockSessionUser({
    priceMultiplier: multiplier,
    ...overrides,
  })
}

/**
 * Create multiple mock SessionUsers with different roles
 * Useful for testing role-based access control
 *
 * @returns Object with users for each role
 */
export function mockUsersWithAllRoles() {
  return {
    customer: mockSessionUser(),
    admin: mockAdminUser(),
    subscriber: mockUserWithRole(RoleEnum.SUBSCRIBER),
  } as const
}
