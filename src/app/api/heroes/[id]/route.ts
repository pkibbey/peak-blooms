import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { heroSchema } from "@/lib/validations/hero"

/**
 * GET /api/heroes/[id]
 * Get a single hero banner by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const hero = await db.heroBanner.findUnique({
      where: { id },
    })

    if (!hero) {
      return NextResponse.json({ error: "Hero not found" }, { status: 404 })
    }

    return NextResponse.json(hero)
  } catch (error) {
    console.error("GET /api/heroes/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch hero" }, { status: 500 })
  }
}

/**
 * PUT /api/heroes/[id]
 * Update a hero banner (admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { getSession } = await import("@/lib/auth")
    const session = await getSession()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Partial validation - allow partial updates
    const validationResult = heroSchema.partial().safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const {
      name,
      slug,
      title,
      subtitle,
      ctaText,
      ctaLink,
      textPosition,
      backgroundType,
      backgroundImage,
      gradientPreset,
      slotPosition,
    } = validationResult.data

    // Check if hero exists
    const existingHero = await db.heroBanner.findUnique({
      where: { id },
    })

    if (!existingHero) {
      return NextResponse.json({ error: "Hero not found" }, { status: 404 })
    }

    // Check for slug uniqueness if changing slug
    if (slug && slug !== existingHero.slug) {
      const slugConflict = await db.heroBanner.findUnique({
        where: { slug },
      })

      if (slugConflict) {
        return NextResponse.json({ error: "A hero with this slug already exists" }, { status: 400 })
      }
    }

    const hero = await db.heroBanner.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(ctaText !== undefined && { ctaText: ctaText || null }),
        ...(ctaLink !== undefined && { ctaLink: ctaLink || null }),
        ...(textPosition !== undefined && { textPosition: textPosition || null }),
        ...(backgroundType !== undefined && { backgroundType }),
        ...(backgroundImage !== undefined && { backgroundImage: backgroundImage || null }),
        ...(gradientPreset !== undefined && { gradientPreset: gradientPreset || null }),
        ...(slotPosition !== undefined && { slotPosition: slotPosition ?? null }),
      },
    })

    return NextResponse.json(hero)
  } catch (error) {
    console.error("PUT /api/heroes/[id] error:", error)
    return NextResponse.json({ error: "Failed to update hero" }, { status: 500 })
  }
}

/**
 * DELETE /api/heroes/[id]
 * Delete a hero banner (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { getSession } = await import("@/lib/auth")
    const session = await getSession()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if hero exists
    const existingHero = await db.heroBanner.findUnique({
      where: { id },
    })

    if (!existingHero) {
      return NextResponse.json({ error: "Hero not found" }, { status: 404 })
    }

    await db.heroBanner.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/heroes/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete hero" }, { status: 500 })
  }
}
