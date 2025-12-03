import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { profileSchema } from "@/lib/validations/auth"

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * GET /api/users/profile
 * Get current user's profile
 */
export async function GET() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("GET /api/users/profile error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

/**
 * PATCH /api/users/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = profileSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const { name, email } = validationResult.data
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If email is not being changed, just update name
    if (email === currentUser.email) {
      const user = await db.user.update({
        where: { id: session.user.id },
        data: {
          ...(name !== undefined && { name: name || null }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
          approved: true,
          createdAt: true,
        },
      })

      return NextResponse.json(user)
    }

    // Email is being changed - check if new email is already in use
    const existingUser = await db.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email address is already in use" }, { status: 400 })
    }

    // Generate verification token
    const verificationToken = crypto.getRandomValues(new Uint8Array(32))
    const tokenHex = Array.from(verificationToken)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification record for email change
    await db.verification.create({
      data: {
        identifier: email, // Store the new email as identifier
        value: tokenHex, // Store token in value field
        expiresAt,
      },
    })

    // Generate verification URL with token
    const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
    const verificationUrl = `${baseUrl}/api/users/verify-email-change?token=${tokenHex}&newEmail=${encodeURIComponent(email)}`

    const emailFrom =
      process.env.NODE_ENV === "development"
        ? "onboarding@resend.dev"
        : process.env.EMAIL_FROM || "noreply@peakblooms.com"

    // Send verification email to new email address
    const verificationEmailResponse = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: "Verify your new email address",
      html: `
        <p>Hello,</p>
        <p>We received a request to change your Peak Blooms account email address. Click the link below to confirm your new email:</p>
        <p><a href="${verificationUrl}">Verify your new email address</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this change, you can ignore this email. Your current email address remains active.</p>
        <p>Best regards,<br/>Peak Blooms Team</p>
      `,
    })

    console.log("[Email Change] Verification email response:", verificationEmailResponse)

    if (verificationEmailResponse.error) {
      console.error(
        "[Email Change] Resend error sending verification email:",
        verificationEmailResponse.error
      )
      throw new Error(
        `Failed to send verification email: ${verificationEmailResponse.error.message}`
      )
    }

    // Send security notice to current email address
    const securityNoticeResponse = await resend.emails.send({
      from: emailFrom,
      to: currentUser.email,
      subject: "Your Peak Blooms email address change request",
      html: `
        <p>Hello,</p>
        <p>We received a request to change the email address associated with your Peak Blooms account from <strong>${currentUser.email}</strong> to <strong>${email}</strong>.</p>
        <p>A verification link has been sent to the new email address. The change will only take effect once the new email is verified.</p>
        <p>If you didn't request this change, please log in to your account immediately to secure it.</p>
        <p>Best regards,<br/>Peak Blooms Team</p>
      `,
    })

    console.log("[Email Change] Security notice response:", securityNoticeResponse)

    if (securityNoticeResponse.error) {
      console.error(
        "[Email Change] Resend error sending security notice:",
        securityNoticeResponse.error
      )
      throw new Error(`Failed to send security notice: ${securityNoticeResponse.error.message}`)
    }

    // Update user's name if provided
    if (name !== undefined && name !== currentUser.name) {
      await db.user.update({
        where: { id: session.user.id },
        data: {
          name: name || null,
        },
      })
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      message:
        "Verification emails sent. Please check your new email address to confirm the change.",
    })
  } catch (error) {
    console.error("PATCH /api/users/profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
