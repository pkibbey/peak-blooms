import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * GET /api/users/verify-email-change?token=xxx&newEmail=xxx
 * Verify email change token and update user's email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const newEmail = searchParams.get("newEmail")

    if (!token || !newEmail) {
      return NextResponse.json({ error: "Missing verification token or email" }, { status: 400 })
    }

    // Find the verification record
    const verification = await db.verification.findFirst({
      where: {
        identifier: newEmail,
        value: token,
      },
    })

    if (!verification) {
      return NextResponse.json({ error: "Invalid or expired verification link" }, { status: 400 })
    }

    // Check if token has expired
    if (new Date() > verification.expiresAt) {
      await db.verification.delete({
        where: { id: verification.id },
      })
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Get the user from session
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Please sign in to verify your email change" },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if new email is still available (in case it was taken while verification was pending)
    const existingUser = await db.user.findUnique({
      where: { email: newEmail },
      select: { id: true },
    })

    if (existingUser && existingUser.id !== user.id) {
      return NextResponse.json({ error: "Email address is no longer available" }, { status: 400 })
    }

    // Update user's email
    await db.user.update({
      where: { id: session.user.id },
      data: {
        email: newEmail,
        emailVerified: true,
      },
    })

    // Delete the verification record
    await db.verification.delete({
      where: { id: verification.id },
    })

    // Redirect to account page with success message
    return NextResponse.redirect(new URL("/account/profile?emailVerified=true", request.url))
  } catch (error) {
    console.error("GET /api/users/verify-email-change error:", error)
    return NextResponse.json({ error: "Failed to verify email change" }, { status: 500 })
  }
}
