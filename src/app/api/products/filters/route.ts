import { db } from "@/lib/db"

export async function GET() {
  try {
    const [colors, stemLengths] = await Promise.all([
      // Collect distinct color IDs from the `colors` array column
      db.product.findMany({
        select: {
          colors: true,
        },
      }),
      // Get stem lengths from variants instead of products
      db.productVariant.findMany({
        where: {
          stemLength: {
            not: null,
          },
        },
        distinct: ["stemLength"],
        select: {
          stemLength: true,
        },
        orderBy: {
          stemLength: "asc",
        },
      }),
    ])

    // Flatten color ID arrays from each product
    const all = colors.flatMap((p) => (p.colors?.length ? p.colors : []))
    const distinctColorIds = Array.from(new Set(all.map((c) => c))).sort()

    const distinctStemLengths = stemLengths
      .map((v) => v.stemLength)
      .filter((length): length is number => length !== null)
      .sort((a, b) => a - b)

    return Response.json({
      // Only send color IDs; components use COLORS map for presentation
      colorIds: distinctColorIds,
      stemLengths: distinctStemLengths,
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return Response.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}
