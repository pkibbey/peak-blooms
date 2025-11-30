import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { heroSchema } from "@/lib/validations/hero"

/**
 * GET /api/heroes
 * Get all hero banners
 */
export async function GET() {
  try {
    const heroes = await db.heroBanner.findMany({
      orderBy: [{ slotPosition: "asc" }, { createdAt: "desc" }],
    })
    return NextResponse.json(heroes)
  } catch (error) {
    console.error("GET /api/heroes error:", error)
    return NextResponse.json({ error: "Failed to fetch heroes" }, { status: 500 })
  }
}

/**
 * POST /api/heroes
 * Create a new hero banner (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = heroSchema.safeParse(body)

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

    // Check for slug uniqueness
    const existingSlug = await db.heroBanner.findUnique({
      where: { slug },
    })

    if (existingSlug) {
      return NextResponse.json({ error: "A hero with this slug already exists" }, { status: 400 })
    }

    const hero = await db.heroBanner.create({
      data: {
        name,
        slug,
        title,
        subtitle,
        ctaText: ctaText || null,
        ctaLink: ctaLink || null,
        textPosition: textPosition || null,
        backgroundType,
        backgroundImage: backgroundImage || null,
        gradientPreset: gradientPreset || null,
        slotPosition: slotPosition ?? null,
      },
    })

    return NextResponse.json(hero, { status: 201 })
  } catch (error) {
    console.error("POST /api/heroes error:", error)
    return NextResponse.json({ error: "Failed to create hero" }, { status: 500 })
  }
}
