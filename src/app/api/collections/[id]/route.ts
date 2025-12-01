import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { collectionSchema } from "@/lib/validations/collection"

/**
 * GET /api/collections/[id]
 * Get a single collection by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const collection = await db.collection.findUnique({
      where: { id },
      include: {
        products: true,
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error("GET /api/collections/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 })
  }
}

/**
 * PUT /api/collections/[id]
 * Update a collection (admin only)
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
    const validationResult = collectionSchema.partial().safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const { name, slug, image, description } = validationResult.data

    // Check if collection exists
    const existingCollection = await db.collection.findUnique({
      where: { id },
    })

    if (!existingCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    const collection = await db.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(image !== undefined && { image }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(collection)
  } catch (error) {
    console.error("PUT /api/collections/[id] error:", error)
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 })
  }
}

/**
 * DELETE /api/collections/[id]
 * Delete a collection (admin only)
 * Note: This will cascade delete all products in the collection
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

    // Check if collection exists
    const existingCollection = await db.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    })

    if (!existingCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    await db.collection.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      deletedProductCount: existingCollection._count.products,
    })
  } catch (error) {
    console.error("DELETE /api/collections/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
