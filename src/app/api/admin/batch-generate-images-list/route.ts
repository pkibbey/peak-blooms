import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"

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

    const products = await db.product.findMany({
      where: whereClause,
      select: { id: true, name: true, productType: true, description: true },
      orderBy: { name: "asc" },
      take: 10,
    })

    return Response.json({ products })
  } catch (err) {
    const error = toAppError(err, "Batch Generate Images List failed")
    return Response.json({ error }, { status: 500 })
  }
}
