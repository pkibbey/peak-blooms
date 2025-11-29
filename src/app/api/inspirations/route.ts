import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"

/**
 * GET /api/inspirations
 * Get all inspirations
 * Prices are adjusted based on the authenticated user's price multiplier
 */
export async function GET() {
  try {
    // Get current user's price multiplier if authenticated
    let priceMultiplier = 1.0
    const session = await auth()
    if (session?.user?.email) {
      const user = await db.user.findUnique({
        where: { email: session.user.email },
        select: { priceMultiplier: true },
      })
      if (user) {
        priceMultiplier = user.priceMultiplier
      }
    }

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

    // Apply price multiplier to product variant prices
    const adjustedInspirations = inspirations.map((inspiration) => ({
      ...inspiration,
      products: inspiration.products.map((p) => ({
        ...p,
        productVariant: p.productVariant
          ? {
              ...p.productVariant,
              price: adjustPrice(p.productVariant.price, priceMultiplier),
            }
          : null,
      })),
    }))

    return NextResponse.json(adjustedInspirations)
  } catch (error) {
    console.error("GET /api/inspirations error:", error)
    return NextResponse.json({ error: "Failed to fetch inspirations" }, { status: 500 })
  }
}

// Type for product selection with required variant
interface ProductSelection {
  productId: string
  productVariantId: string
  quantity?: number
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
      productSelections, // Array of { productId, productVariantId }
    } = body

    if (!name || !slug || !subtitle || !image || !excerpt || !inspirationText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate product selections - each must have a variant
    const selections: ProductSelection[] = productSelections || []
    const invalidSelections = selections.filter((sel) => !sel.productId || !sel.productVariantId)
    if (invalidSelections.length > 0) {
      return NextResponse.json(
        { error: "Each product must have a specific variant selected" },
        { status: 400 }
      )
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
              productVariantId: sel.productVariantId,
              quantity: Math.max(1, sel.quantity || 1),
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
