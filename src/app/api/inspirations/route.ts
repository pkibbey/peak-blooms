import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

/**
 * GET /api/inspirations
 * Get all inspirations
 */
export async function GET() {
  try {
    const inspirations = await db.inspiration.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(inspirations)
  } catch (error) {
    console.error("GET /api/inspirations error:", error)
    return NextResponse.json({ error: "Failed to fetch inspirations" }, { status: 500 })
  }
}

// Type for product selection with optional variant
interface ProductSelection {
  productId: string
  productVariantId?: string | null
}

/**
 * POST /api/inspirations
 * Create a new inspiration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const {
      name,
      slug,
      subtitle,
      image,
      excerpt,
      inspirationText,
      productSelections, // New: array of { productId, productVariantId }
      productIds, // Legacy support: array of product IDs (uses first variant)
    } = body

    if (!name || !slug || !subtitle || !image || !excerpt || !inspirationText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Handle both new format (productSelections) and legacy format (productIds)
    let selections: ProductSelection[] = []
    if (productSelections && productSelections.length > 0) {
      selections = productSelections
    } else if (productIds && productIds.length > 0) {
      selections = productIds.map((id: string) => ({ productId: id, productVariantId: null }))
    }

    const inspiration = await db.inspiration.create({
      data: {
        name,
        slug,
        subtitle,
        image,
        excerpt,
        inspirationText,
        ...(selections.length > 0 && {
          products: {
            create: selections.map((sel: ProductSelection) => ({
              productId: sel.productId,
              productVariantId: sel.productVariantId || null,
            })),
          },
        }),
      },
      include: {
        products: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    })

    return NextResponse.json(inspiration, { status: 201 })
  } catch (error) {
    console.error("POST /api/inspirations error:", error)
    return NextResponse.json({ error: "Failed to create inspiration" }, { status: 500 })
  }
}
