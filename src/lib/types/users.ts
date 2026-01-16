/**
 * User Types - Re-exported from query-types.ts for backward compatibility
 *
 * This file serves as a re-export barrel for user-related types.
 * New types should be added to src/lib/query-types.ts and imported here.
 */

import type {
  SessionUser as SessionUserBase,
  UserForAdmin,
  UserForProfile,
  UserFull,
  UserWithAddresses,
} from "@/lib/query-types"

// Re-exports from query-types.ts
export type { UserFull, UserForAdmin, UserForProfile, UserWithAddresses }

/**
 * SessionUser: Minimal user data derived from Prisma User for session storage
 * Derived from query-types.ts and auto-syncs with User schema changes.
 * All non-id/email fields are optional since sessions are cached.
 *
 * Use when: Session storage, component user props, cached user data
 */
export type SessionUser = SessionUserBase
