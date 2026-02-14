import { cache } from "react"
import type { SessionUser } from "@/lib/query-types"
import { getSession } from "./auth"

/**
 * Get the current authenticated user with their approval and role status
 * Wrapped in React cache() to deduplicate calls within a single request
 *
 * Better Auth provides user data directly in the session with custom fields
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  let session: Awaited<ReturnType<typeof getSession>> | null = null
  // Let errors from getSession bubble up so callers/tests can detect auth failures
  session = await getSession()

  if (!session?.user?.email) {
    return null
  }

  // Return user data with custom fields from better-auth session
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || undefined,
    role: (session.user.role as "CUSTOMER" | "ADMIN") ?? "CUSTOMER",
    approved: (session.user.approved as boolean) ?? false,
    priceMultiplier: (session.user.priceMultiplier as number) ?? 1.0,
  }
})
