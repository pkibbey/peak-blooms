import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getProductById } from "@/lib/data"
import { db } from "@/lib/db"
import { createProductSchema } from "@/lib/validations/product"

/**
 * GET /api/products/[id]
 * Get a single product by ID
 * Prices are adjusted based on the authenticated user's price multiplier
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Get current user's price multiplier if authenticated
    let priceMultiplier = 1.0
    const session = await getSession()
    if (session?.user) {
      priceMultiplier = session.user.priceMultiplier ?? 1.0
    }

    const product = await getProductById(id, priceMultiplier)

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error("GET /api/products/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

/**
 * PUT /api/products/[id]
 * Update a product with variants (admin only)
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
    const validationResult = createProductSchema.partial().safeParse(body)

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

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // If variants are provided, validate at least one exists
    if (variants !== undefined) {
      if (!Array.isArray(variants) || variants.length === 0) {
        return NextResponse.json({ error: "At least one variant is required" }, { status: 400 })
      }
    }

    // Use transaction to update product and replace variants
    const product = await db.$transaction(async (tx) => {
      // If variants provided, delete existing and recreate
      if (variants !== undefined) {
        await tx.productVariant.deleteMany({
          where: { productId: id },
        })
      }

      return tx.product.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(image !== undefined && { image }),
          ...(colors !== undefined && { colors: colors ?? [] }),
          ...(collectionId !== undefined && {
            // Use relation connect so Prisma's checked update input accepts it
            collection: { connect: { id: collectionId } },
          }),
          ...(productType !== undefined && { productType }),
          ...(featured !== undefined && { featured }),
          ...(variants !== undefined && {
            variants: {
              create: variants.map((v) => ({
                price: v.price,
                stemLength: v.stemLength ?? null,
                countPerBunch: v.countPerBunch ?? null,
                isBoxlot: v.isBoxlot ?? false,
              })),
            },
          }),
        },
        include: {
          collection: true,
          variants: true,
        },
      })
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

/**
 * DELETE /api/products/[id]
 * Delete a product (admin only)
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

    // Check if product exists
    const existingProduct = await db.product.findUnique({
      where: { id },
    })

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    await db.product.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
