import { cache } from "react"
import { getSession } from "./auth"
import type { SessionUser } from "./types/users"

/**
 * Get the current authenticated user with their approval and role status
 * Wrapped in React cache() to deduplicate calls within a single request
 *
 * Better Auth provides user data directly in the session with custom fields
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await getSession()

  if (!session?.user?.email) {
    return null
  }

  // Return user data with custom fields from better-auth session
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? null,
    role: (session.user.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER",
    approved: (session.user.approved as boolean) ?? false,
    priceMultiplier: (session.user.priceMultiplier as number) ?? 1.0,
  }
})
