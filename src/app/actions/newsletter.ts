"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

import { newsletterSubscribeSchema } from "@/lib/validations/newsletter"
import { wrapAction } from "@/server/error-handler"

/**
 * Subscribe to newsletter
 * Creates a SUBSCRIBER user account (silently succeeds if email already exists)
 */
export const subscribeToNewsletterAction = wrapAction(
  async (email: string): Promise<{ userId?: string }> => {
    // Validate email
    const validation = newsletterSubscribeSchema.safeParse({ email })
    if (!validation.success) {
      // Silently succeed to prevent email enumeration
      return {}
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    // Silently succeed even if user exists (prevents email enumeration attacks)
    if (existingUser) {
      return {}
    }

    // Create new newsletter subscriber user
    const user = await db.user.create({
      data: {
        email,
        role: "SUBSCRIBER",
        approved: false,
        emailVerified: false,
      },
    })

    revalidatePath("/")
    return { userId: user.id }
  }
)
