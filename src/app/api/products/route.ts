import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getProducts } from "@/lib/data"
import { db } from "@/lib/db"
import { createProductSchema } from "@/lib/validations/product"

/**
 * GET /api/products
 * Get all products (with optional filtering)
 * Query params: collectionId, featured, color, stemLength, priceMin, priceMax
 * Prices are adjusted based on the authenticated user's price multiplier
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collectionId")
    const featured = searchParams.get("featured")
    const color = searchParams.get("color")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const boxlotOnly = searchParams.get("boxlotOnly")

    const products = await getProducts(
      {
        collectionId: collectionId || undefined,
        featured: featured === "true",
        color: color || undefined,
        priceMin: priceMin ? parseFloat(priceMin) : undefined,
        priceMax: priceMax ? parseFloat(priceMax) : undefined,
        boxlotOnly: boxlotOnly === "true",
      },
      priceMultiplier
    )

    return NextResponse.json(products)
  } catch (error) {
    console.error("GET /api/products error:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

/**
 * POST /api/products
 * Create a new product with variants (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { auth } = await import("@/lib/auth")
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createProductSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const { name, slug, description, image, color, collectionId, featured, variants } =
      validationResult.data

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        image,
        color: color || null,
        collectionId,
        featured: featured === true,
        variants: {
          create: variants.map((v) => ({
            price: v.price,
            stemLength: v.stemLength ?? null,
            countPerBunch: v.countPerBunch ?? null,
            isBoxlot: v.isBoxlot ?? false,
          })),
        },
      },
      include: {
        collection: true,
        variants: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
