import { db } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/products/[id]/variants
 * Get all variants for a specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      )
    }

    const variants = await db.productVariant.findMany({
      where: { productId: id },
      select: {
        id: true,
        price: true,
        stemLength: true,
        countPerBunch: true,
      },
      orderBy: [
        { stemLength: "asc" },
        { countPerBunch: "asc" }
      ]
    })

    return NextResponse.json(variants)
  } catch (error) {
    console.error("GET /api/products/[id]/variants error:", error)
    return NextResponse.json(
      { error: "Failed to fetch variants" },
      { status: 500 }
    )
  }
}
