import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { newsletterSubscribeSchema } from "@/lib/validations/newsletter"

/**
 * POST /api/newsletter/subscribe
 * Create a newsletter subscriber account
 * Silently fails if email already exists
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate email
    const validation = newsletterSubscribeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    const { email } = validation.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    // Silently succeed even if user exists (prevents email enumeration attacks)
    if (existingUser) {
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Create new newsletter subscriber user
    const user = await db.user.create({
      data: {
        email,
        role: "NEWSLETTER_SUBSCRIBER",
        approved: false,
        emailVerified: false,
      },
    })

    return NextResponse.json(
      {
        success: true,
        userId: user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST /api/newsletter/subscribe error:", error)
    // Silently fail on server error to not leak information
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
