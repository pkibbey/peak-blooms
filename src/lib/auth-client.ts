import { createAuthClient } from "better-auth/react"

/**
 * Better Auth client instance for use in client components
 * Provides useSession, signOut, and OAuth sign-in methods
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
})

// Re-export commonly used hooks and methods
export const { useSession, signOut } = authClient
