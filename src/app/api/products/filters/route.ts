import { db } from "@/lib/db"

export async function GET() {
  try {
    const colors = await db.product.findMany({
      select: {
        colors: true,
      },
    })

    // Flatten color ID arrays from each product
    const all = colors.flatMap((p) => (p.colors?.length ? p.colors : []))
    const distinctColorIds = Array.from(new Set(all.map((c) => c))).sort()

    return Response.json({
      // Only send color IDs; components use COLORS map for presentation
      colorIds: distinctColorIds,
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return Response.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}
