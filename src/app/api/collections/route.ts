import { type NextRequest, NextResponse } from "next/server"
import { getAllCollections } from "@/lib/data"
import { db } from "@/lib/db"
import { collectionSchema } from "@/lib/validations/collection"

/**
 * GET /api/collections
 * Get all product collections
 */
export async function GET() {
  try {
    const collections = await getAllCollections()
    return NextResponse.json(collections)
  } catch (error) {
    console.error("GET /api/collections error:", error)
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 })
  }
}

/**
 * POST /api/collections
 * Create a new collection (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = collectionSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const { name, slug, image, description } = validationResult.data

    const collection = await db.collection.create({
      data: {
        name,
        slug,
        image: image || null,
        description: description || null,
      },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error) {
    console.error("POST /api/collections error:", error)
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 })
  }
}
