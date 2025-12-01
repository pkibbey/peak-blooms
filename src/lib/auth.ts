import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { magicLink } from "better-auth/plugins"
import { headers } from "next/headers"
import { Resend } from "resend"
import { db } from "./db"

const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  plugins: [
    nextCookies(),
    magicLink({
      async sendMagicLink({ email, url }) {
        console.log("[Magic Link] Sending magic link email")
        console.log("[Magic Link] Email to:", email)
        console.log("[Magic Link] URL:", url)
        console.log("[Magic Link] RESEND_API_KEY configured:", !!process.env.RESEND_API_KEY)
        console.log("[Magic Link] NODE_ENV:", process.env.NODE_ENV)

        try {
          // Use Resend's test email for development
          const emailFrom =
            process.env.NODE_ENV === "development"
              ? "onboarding@resend.dev"
              : process.env.EMAIL_FROM || "noreply@peakblooms.com"

          console.log("[Magic Link] Using email from:", emailFrom)
          console.log("[Magic Link] Calling resend.emails.send()...")

          const response = await resend.emails.send({
            from: emailFrom,
            to: email,
            subject: "Sign in to Peak Blooms",
            html: `<p>Click the link below to sign in:</p><a href="${url}">Sign in</a><p>Link expires in 5 minutes.</p>`,
          })

          console.log("[Magic Link] Resend response:", response)

          if (response.error) {
            console.error("[Magic Link] Resend error:", response.error)
            throw new Error(`Failed to send email: ${response.error.message}`)
          }

          console.log("[Magic Link] Email sent successfully with ID:", response.data?.id)
        } catch (error) {
          console.error("[Magic Link] Failed to send magic link email:", error)
          throw new Error("Failed to send email")
        }
      },
    }),
  ],
  appName: "Peak Blooms",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
