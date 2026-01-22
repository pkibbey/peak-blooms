"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult } from "@/lib/query-types"
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter"

/**
 * Subscribe to newsletter
 * Creates a SUBSCRIBER user account (silently succeeds if email already exists)
 */
export async function subscribeToNewsletterAction(
  email: string
): Promise<AppResult<{ userId?: string }>> {
  try {
    // Validate email
    const validation = newsletterSubscribeSchema.safeParse({ email })
    if (!validation.success) {
      // Silently succeed to prevent email enumeration
      return { success: true, data: {} }
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    // Silently succeed even if user exists (prevents email enumeration attacks)
    if (existingUser) {
      return { success: true, data: {} }
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
    return { success: true, data: { userId: user.id } }
  } catch (err) {
    return toAppError(err, "Error while subscribing to newsletter")
  }
}
