import { toNextJsHandler } from "better-auth/next-js"
import { auth } from "@/lib/auth"

/**
 * Better Auth API routes handler
 * Handles all authentication requests
 */
export const { GET, POST } = toNextJsHandler(auth)
