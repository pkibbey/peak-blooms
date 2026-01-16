"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter"

/**
 * Subscribe to newsletter
 * Creates a SUBSCRIBER user account (silently succeeds if email already exists)
 */
export async function subscribeToNewsletterAction(
  email: string
): Promise<{ success: boolean; userId?: string }> {
  try {
    // Validate email
    const validation = newsletterSubscribeSchema.safeParse({ email })
    if (!validation.success) {
      throw new Error("Invalid email")
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    // Silently succeed even if user exists (prevents email enumeration attacks)
    if (existingUser) {
      return { success: true }
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
    return { success: true, userId: user.id }
  } catch {
    // Silently fail on error to not leak information
    return { success: true }
  }
}
