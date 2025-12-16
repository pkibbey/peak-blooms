import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { inspirationSchema, type ProductSelection } from "@/lib/validations/inspiration"

/**
 * GET /api/inspirations
 * Get all inspirations
 * Prices are adjusted based on the authenticated user's price multiplier
 */
export async function GET() {
  try {
    // Get current user's price multiplier if authenticated
    let priceMultiplier = 1.0
    const session = await getSession()
    if (session?.user) {
      priceMultiplier = session.user.priceMultiplier ?? 1.0
    }

    const inspirations = await db.inspiration.findMany({
      include: {
        products: {
          include: {
            product: {
              include: {
                productCollections: {
                  include: {
                    collection: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    // Apply price multiplier to product prices
    const adjustedInspirations = inspirations.map((inspiration) => ({
      ...inspiration,
      products: inspiration.products.map((p) => ({
        ...p,
        product: {
          ...p.product,
          price: adjustPrice(p.product.price, priceMultiplier),
        },
      })),
    }))

    return NextResponse.json(adjustedInspirations)
  } catch (error) {
    console.error("GET /api/inspirations error:", error)
    return NextResponse.json({ error: "Failed to fetch inspirations" }, { status: 500 })
  }
}

/**
 * POST /api/inspirations
 * Create a new inspiration (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { getSession } = await import("@/lib/auth")
    const session = await getSession()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = inspirationSchema.safeParse(body)

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
      subtitle,
      image,
      excerpt,
      text,
      productSelections, // Array of { productId, quantity }
    } = validationResult.data

    // Use product selections as-is
    const selections: ProductSelection[] = productSelections || []
    if (selections.length === 0) {
      return NextResponse.json({ error: "At least one product must be selected" }, { status: 400 })
    }

    const inspiration = await db.inspiration.create({
      data: {
        name,
        slug,
        subtitle,
        image,
        excerpt,
        text,
        ...(selections.length > 0 && {
          products: {
            create: selections.map((sel: ProductSelection) => ({
              productId: sel.productId,
              quantity: Math.max(1, sel.quantity || 1),
            })),
          },
        }),
      },
      include: {
        products: {
          include: {
            product: true,
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
