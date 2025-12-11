import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { headers } from "next/headers"
import { db } from "./db"

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [nextCookies()],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  account: {
    accountLinking: {
      trustedProviders: ["google"],
    },
  },
  appName: "Peak Blooms",
  baseURL: process.env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: process.env.BETTER_AUTH_SECRET,
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },
  user: {
    additionalFields: {
      approved: {
        type: "boolean",
        defaultValue: false,
      },
      role: {
        type: "string",
        defaultValue: "CUSTOMER",
      },
      priceMultiplier: {
        type: "number",
        defaultValue: 1.0,
      },
      phone: {
        type: "string",
      },
    },
  },
})

/**
 * Get the current session on the server side
 * For server components and route handlers
 */
export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  })
}

/**
 * Revoke all sessions for a user by deleting their sessions from the database.
 * Call this when admin changes a user's permissions (approved, role, priceMultiplier).
 * The user will need to sign in again to get a new session with updated permissions.
 */
export async function invalidateUserSessions(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  })
}
