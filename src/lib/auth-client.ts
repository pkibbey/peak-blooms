import { magicLinkClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

/**
 * Better Auth client instance for use in client components
 * Provides useSession, signIn, magicLink, and other auth methods
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [magicLinkClient()],
})

// Re-export commonly used hooks and methods
export const { useSession, signOut } = authClient
