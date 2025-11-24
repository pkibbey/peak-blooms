import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import Email from "next-auth/providers/email";
import { Resend } from "resend";
import { db } from "./db";

const resend = new Resend(process.env.RESEND_API_KEY);

// Determine email domain based on environment
const emailFromDomain =
  process.env.NODE_ENV === "development"
    ? "onboarding@resend.dev"
    : process.env.EMAIL_FROM_DOMAIN || "onboarding@resend.dev";

declare module "next-auth" {
  interface User {
    id: string;
    approved: boolean;
    role: "CUSTOMER" | "ADMIN";
  }

  interface Session {
    user: User & {
      email: string;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
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
          });
        } catch (error) {
          console.error("Email send failed:", error);
          throw error;
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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.approved = user.approved;
        session.user.role = user.role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // User account is created with approved: false by default
      // This event fires on successful sign-in
      console.log(`User signed in: ${user.email}`);
    },
  },
});

