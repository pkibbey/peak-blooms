import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getProducts } from "@/lib/data"
import { db } from "@/lib/db"
import { createProductSchema } from "@/lib/validations/product"

/**
 * GET /api/products
 * Get all products (with optional filtering and pagination)
 * Query params: collectionId, featured, colors, stemLength, priceMin, priceMax, limit, offset
 * Prices are adjusted based on the authenticated user's price multiplier
 * Returns: { products: ProductWithVariantsAndCollection[], total: number, limit: number, offset: number }
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user's price multiplier if authenticated
    let priceMultiplier = 1.0
    const session = await getSession()
    if (session?.user) {
      priceMultiplier = session.user.priceMultiplier ?? 1.0
    }

    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collectionId")
    const featured = searchParams.get("featured")
    // Support multi-color query param: ?colors=#FF0000&colors=#00FF00 or ?colors=#FF0000,#00FF00
    const colorsFromQuery = searchParams.getAll("colors")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const boxlotOnly = searchParams.get("boxlotOnly")
    const limitParam = searchParams.get("limit")
    const offsetParam = searchParams.get("offset")
    const limit = limitParam ? parseInt(limitParam, 10) : 12
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    const result = await getProducts(
      {
        collectionId: collectionId || undefined,
        featured: featured === "true",
        // Prefer explicit `colors` query params if provided
        colors:
          colorsFromQuery.length > 0
            ? // allow comma separated in a single param as well
              colorsFromQuery.flatMap((c) =>
                c
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean)
              )
            : undefined,
        priceMin: priceMin ? parseFloat(priceMin) : undefined,
        priceMax: priceMax ? parseFloat(priceMax) : undefined,
        boxlotOnly: boxlotOnly === "true",
        limit,
        offset,
      },
      priceMultiplier
    )

    return NextResponse.json(result)
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
    const { getSession } = await import("@/lib/auth")
    const session = await getSession()

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

    const {
      name,
      slug,
      description,
      image,
      colors,
      collectionId,
      productType,
      featured,
      variants,
    } = validationResult.data

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        image,
        // Save provided colors array (no legacy single color field)
        ...(colors !== undefined && { colors: colors ?? [] }),
        // Connect collection by id rather than sending raw scalar (keeps Prisma input consistent with nested variants)
        collection: { connect: { id: collectionId } },
        productType: productType ?? "FLOWER",
        featured: featured === true,
        variants: {
          create: variants.map((v) => ({
            price: v.price,
            stemLength: v.stemLength ?? null,
            quantityPerBunch: v.quantityPerBunch ?? null,
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
