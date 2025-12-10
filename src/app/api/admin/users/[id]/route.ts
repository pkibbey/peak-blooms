import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth, invalidateUserSessions } from "@/lib/auth"
import { db } from "@/lib/db"
import { isValidPriceMultiplier } from "@/lib/utils"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/admin/users/[id]
 * Update a user's approval status or price multiplier (admin only)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { approved, priceMultiplier } = body

    // Build update data object
    const updateData: { approved?: boolean; priceMultiplier?: number } = {}

    if (typeof approved === "boolean") {
      updateData.approved = approved
    }

    if (priceMultiplier !== undefined) {
      if (!isValidPriceMultiplier(priceMultiplier)) {
        return NextResponse.json(
          { error: "Price multiplier must be between 0.5 and 2.0" },
          { status: 400 }
        )
      }
      updateData.priceMultiplier = priceMultiplier
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        approved: true,
        priceMultiplier: true,
        createdAt: true,
      },
    })

    // Only invalidate sessions if we're updating someone else.
    // When updating yourself (even if changing approval status), keep the session active
    // so you can see the changes reflected immediately without being logged out.
    const isCurrentUser = session.user.id === id

    if (!isCurrentUser) {
      // Revoke sessions for the target user so their session reflects any
      // changes to their permissions.
      await invalidateUserSessions(id)
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("PATCH /api/admin/users/[id] error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
