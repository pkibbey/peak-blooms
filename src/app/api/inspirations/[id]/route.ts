import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/inspirations/[id]
 * Get a single inspiration by ID
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const inspiration = await db.inspiration.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              include: {
                collection: true,
                variants: true,
              },
            },
            productVariant: true,
          },
        },
      },
    })

    if (!inspiration) {
      return NextResponse.json({ error: "Inspiration not found" }, { status: 404 })
    }

    return NextResponse.json(inspiration)
  } catch (error) {
    console.error("GET /api/inspirations/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch inspiration" }, { status: 500 })
  }
}

// Type for product selection with optional variant
interface ProductSelection {
  productId: string
  productVariantId?: string | null
}

/**
 * PUT /api/inspirations/[id]
 * Update an inspiration (admin only)
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const {
      name,
      slug,
      subtitle,
      image,
      excerpt,
      inspirationText,
      productSelections, // New: array of { productId, productVariantId }
      productIds, // Legacy support: array of product IDs
    } = body

    // Check if inspiration exists
    const existingInspiration = await db.inspiration.findUnique({
      where: { id },
    })

    if (!existingInspiration) {
      return NextResponse.json({ error: "Inspiration not found" }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (image !== undefined) updateData.image = image
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (inspirationText !== undefined) updateData.inspirationText = inspirationText

    // Handle product associations with variants
    if (productSelections !== undefined || productIds !== undefined) {
      // Delete existing products first
      await db.inspirationProduct.deleteMany({
        where: { inspirationId: id },
      })

      // Handle both new format (productSelections) and legacy format (productIds)
      let selections: ProductSelection[] = []
      if (productSelections && productSelections.length > 0) {
        selections = productSelections
      } else if (productIds && productIds.length > 0) {
        selections = productIds.map((pid: string) => ({ productId: pid, productVariantId: null }))
      }

      // Create new product associations
      if (selections.length > 0) {
        updateData.products = {
          create: selections.map((sel: ProductSelection) => ({
            productId: sel.productId,
            productVariantId: sel.productVariantId || null,
          })),
        }
      }
    }

    const inspiration = await db.inspiration.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          include: {
            product: {
              include: {
                collection: true,
              },
            },
            productVariant: true,
          },
        },
      },
    })

    return NextResponse.json(inspiration)
  } catch (error) {
    console.error("PUT /api/inspirations/[id] error:", error)
    return NextResponse.json({ error: "Failed to update inspiration" }, { status: 500 })
  }
}

/**
 * DELETE /api/inspirations/[id]
 * Delete an inspiration (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check if inspiration exists
    const existingInspiration = await db.inspiration.findUnique({
      where: { id },
    })

    if (!existingInspiration) {
      return NextResponse.json({ error: "Inspiration not found" }, { status: 404 })
    }

    await db.inspiration.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/inspirations/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete inspiration" }, { status: 500 })
  }
}
