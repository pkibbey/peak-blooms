import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: Request): Promise<Response> {
  try {
    // Parse query params for filters
    const url = new URL(request.url)
    const filterDescription = url.searchParams.get("filterDescription") as "has" | "missing" | null
    const filterImages = url.searchParams.get("filterImages") as "has" | "missing" | null
    const typesParam = url.searchParams.get("types")
    const types = typesParam ? typesParam.split(",").filter(Boolean) : null
    const productType = url.searchParams.get("productType")

    // Auth check
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Batch Generate Images List API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    }

    // For images, default to missing
    if (filterImages === "has") {
      whereClause.images = { isEmpty: false }
    } else {
      whereClause.images = { isEmpty: true }
    }

    // Apply description filter if provided
    if (filterDescription === "has") {
      whereClause.AND = [{ description: { not: null } }, { description: { not: "" } }]
    } else if (filterDescription === "missing") {
      whereClause.OR = [{ description: null }, { description: "" }]
    }

    // Filter by specific product type(s)
    const ProductTypeEnum = require("@/generated/client").ProductType
    if (types && types.length > 0) {
      whereClause.productType = {
        in: types.map((t) => ProductTypeEnum[t as keyof typeof ProductTypeEnum]),
      }
    } else if (productType) {
      whereClause.productType = ProductTypeEnum[productType as keyof typeof ProductTypeEnum]
    }

    console.info("[Batch Generate Images List API] Fetching next 10 products without images")
    const products = await db.product.findMany({
      where: whereClause,
      select: { id: true, name: true, productType: true, description: true },
      orderBy: { name: "asc" },
      take: 10,
    })

    console.info(`[Batch Generate Images List API] Found ${products.length} products`)

    return Response.json({ products })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Batch Generate Images List API] Unexpected error:", err)
    return Response.json({ error: `Unexpected error: ${errorMessage}` }, { status: 500 })
  }
}
