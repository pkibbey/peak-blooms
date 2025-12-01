import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Determine email domain based on environment
const emailFromDomain =
  process.env.NODE_ENV === "development"
    ? "onboarding@resend.dev"
    : process.env.EMAIL_FROM_DOMAIN || "onboarding@resend.dev"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    console.log("email: ", email)

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    console.log("Attempting to resend confirmation email to:", email)
    console.log("Using email domain:", emailFromDomain)
    console.log("API key exists:", !!process.env.RESEND_API_KEY)

    const result = await resend.emails.send({
      from: `Peak Blooms <${emailFromDomain}>`,
      to: email,
      subject: "Confirm Your Peak Blooms Account",
      html: `
        <p>Thank you for signing up for Peak Blooms!</p>
        <p>Your account is pending approval from our team. This typically takes 24-48 hours.</p>
        <p>In the meantime, feel free to explore our inspiration collections and learn more about our products.</p>
        <p>If you need to sign in, you can request a magic link by returning to our sign-in page.</p>
        <p>Thank you for your patience!</p>
      `,
    })

    console.log("Resend API result:", result)

    if (result.error) {
      console.error("Resend error:", result.error)
      return NextResponse.json(
        { error: `Failed to send email: ${result.error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Confirmation email sent", id: result.data?.id },
      { status: 200 }
    )
  } catch (error) {
    console.error("Failed to resend email - exception:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: `Failed to send email: ${errorMessage}` }, { status: 500 })
  }
}
