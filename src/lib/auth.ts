import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import Email from "next-auth/providers/email"
import { Resend } from "resend"
import { db } from "./db"

const resend = new Resend(process.env.RESEND_API_KEY)

// Determine email domain based on environment
const emailFromDomain =
  process.env.NODE_ENV === "development"
    ? "onboarding@resend.dev"
    : process.env.EMAIL_FROM_DOMAIN || "onboarding@resend.dev"

declare module "next-auth" {
  interface User {
    id: string
    approved: boolean
    role: "CUSTOMER" | "ADMIN"
    priceMultiplier: number
  }

  interface Session {
    user: User & {
      email: string
    }
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string
    approved: boolean
    role: "CUSTOMER" | "ADMIN"
    priceMultiplier: number
  }
}

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      // Using Resend as the email provider
      async sendVerificationRequest({ identifier, url }) {
        try {
          await resend.emails.send({
            from: `Peak Blooms <${emailFromDomain}>`,
            to: identifier,
            subject: "Sign in to Peak Blooms",
            html: `
              <p>Click the link below to sign in to your Peak Blooms account:</p>
              <a href="${url}">Sign in</a>
              <p>This link expires in 24 hours.</p>
            `,
          })
        } catch (error) {
          console.error("Email send failed:", error)
          throw error
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, user object is available
      if (user) {
        // Fetch full user data from database
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.approved = dbUser.approved
          token.role = dbUser.role
          token.priceMultiplier = dbUser.priceMultiplier
        }
      }
      return token
    },
    async session({ session, token }) {
      // Transfer token data to session (no DB query needed)
      if (session.user) {
        session.user.id = token.id
        session.user.approved = token.approved
        session.user.role = token.role
        session.user.priceMultiplier = token.priceMultiplier
      }
      return session
    },
  },
  events: {
    async signIn({ user }) {
      // User account is created with approved: false by default
      // This event fires on successful sign-in
      console.log(`User signed in: ${user.email}`)
    },
  },
})

/**
 * Invalidate all sessions for a user by deleting their sessions from the database.
 * Call this when admin changes a user's permissions (approved, role, priceMultiplier).
 * The user will need to sign in again to get a new JWT with updated permissions.
 */
export async function invalidateUserSessions(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  })
}
