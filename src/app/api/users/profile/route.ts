import { revalidateTag } from "next/cache"
import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { profileSchema } from "@/lib/validations/auth"

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
 * Update current user's profile (name only)
 * Email cannot be changed - it's verified by Google OAuth
 * Phone is now part of delivery addresses
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

    const { name } = validationResult.data
    const currentUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user's name if provided
    const updateData: { name?: string | null } = {}
    if (name !== undefined && name !== currentUser.name) {
      updateData.name = name || null
    }

    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: session.user.id },
        data: updateData,
      })
      // Revalidate the user profile cache after successful update
      revalidateTag("user-profile", "max")
    }

    const updatedUser = await db.user.findUnique({
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

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("PATCH /api/users/profile error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
