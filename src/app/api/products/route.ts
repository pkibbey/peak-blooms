import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { ITEMS_PER_PAGE } from "@/lib/consts"
import { getProducts } from "@/lib/data"
import { db } from "@/lib/db"
import { createProductSchema } from "@/lib/validations/product"

/**
 * GET /api/products
 * Get all products (with optional filtering and pagination)
 * Query params: collectionIds (comma-separated or array), featured, colors, stemLength, priceMin, priceMax, search, limit, offset
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
    // Support collectionIds as comma-separated or array query param: ?collectionIds=abc,def or ?collectionIds=abc&collectionIds=def
    const collectionIdsFromQuery = searchParams.getAll("collectionIds")
    const collectionIds =
      collectionIdsFromQuery.length > 0
        ? collectionIdsFromQuery.flatMap((c) =>
            c
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean)
          )
        : undefined
    const featured = searchParams.get("featured")
    const colorsFromQuery = searchParams.getAll("colors")
    const priceMin = searchParams.get("priceMin")
    const priceMax = searchParams.get("priceMax")
    const search = searchParams.get("search")
    const limitParam = searchParams.get("limit")
    const offsetParam = searchParams.get("offset")
    const limit = limitParam ? parseInt(limitParam, 10) : ITEMS_PER_PAGE
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0

    const result = await getProducts(
      {
        collectionIds,
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
        search: search || undefined,
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
 * Create a new product (admin only)
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

    const { name, slug, description, image, price, colors, collectionIds, productType, featured } =
      validationResult.data

    const product = await db.product.create({
      data: {
        name,
        slug,
        description,
        image,
        price,
        // Save provided colors array (no legacy single color field)
        ...(colors !== undefined && { colors: colors ?? [] }),
        productType: productType ?? "FLOWER",
        featured: featured === true,
        // Create junction table entries for each collection
        productCollections: {
          create: collectionIds.map((collectionId) => ({
            collectionId,
          })),
        },
      },
      include: {
        productCollections: {
          include: {
            collection: true,
          },
        },
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("POST /api/products error:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
