import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || null),
  phone: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => val || null),
  role: z.enum(["CUSTOMER", "ADMIN", "SUBSCRIBER"]).default("CUSTOMER"),
  priceMultiplier: z.coerce.number().min(0.5).max(20.0).default(1.0),
})

/**
 * POST /api/admin/users/create
 * Create a new user (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const data = createUserSchema.parse(body)

    try {
      const user = await db.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          priceMultiplier: data.priceMultiplier,
          emailVerified: true,
          approved: false,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          approved: true,
          priceMultiplier: true,
          createdAt: true,
        },
      })

      return NextResponse.json(user, { status: 201 })
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes("Unique constraint failed")) {
        return NextResponse.json({ error: "Email already exists" }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }

    console.error("POST /api/admin/users/create error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
