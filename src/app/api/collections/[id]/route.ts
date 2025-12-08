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
        productCollections: {
          include: {
            product: true,
          },
        },
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
    const { productIds, ...collectionData } = body

    // Partial validation - allow partial updates
    const validationResult = collectionSchema.partial().safeParse(collectionData)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const { name, slug, image, description, featured } = validationResult.data

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
        ...(featured !== undefined && { featured }),
        // Handle product associations
        ...(productIds !== undefined && {
          productCollections: {
            deleteMany: {},
            create: productIds.map((productId: string) => ({
              productId,
            })),
          },
        }),
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
 * Note: Removing a collection will not delete products — product.collectionId will be set to null.
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

    // Check if collection exists and count affected products
    const existingCollection = await db.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productCollections: true },
        },
      },
    })

    if (!existingCollection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    // Delete the collection (ProductCollection junction entries cascade delete)
    await db.collection.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      affectedProductCount: existingCollection._count.productCollections,
    })
  } catch (error) {
    console.error("DELETE /api/collections/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 })
  }
}
