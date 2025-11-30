import { COLOR_BY_HEX, findNearestColor } from "@/lib/colors"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const [colors, stemLengths] = await Promise.all([
      // Collect distinct colors from the `colors` array column
      db.product.findMany({
        where: {
          colors: { not: null },
        },
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

    // Flatten color arrays from each product
    const all = colors.flatMap((p) => (p.colors?.length ? p.colors : []))
    const distinctColors = Array.from(new Set(all.map((c) => c))).sort()

    // Provide a human-friendly mapping for the returned colors
    const colorOptions = distinctColors.map((hex) => {
      const maybe = COLOR_BY_HEX[hex.toLowerCase()]
      const canonical = maybe ?? findNearestColor(hex) ?? null
      return {
        hex,
        label: canonical ? canonical.label : hex,
        id: canonical ? canonical.id : hex,
      }
    })

    const distinctStemLengths = stemLengths
      .map((v) => v.stemLength)
      .filter((length): length is number => length !== null)
      .sort((a, b) => a - b)

    return Response.json({
      // Backwards-compatible: keep raw distinct string array
      colors: distinctColors,
      // New: richer colour metadata for UI (hex, label, id)
      colorOptions,
      stemLengths: distinctStemLengths,
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return Response.json({ error: "Failed to fetch filter options" }, { status: 500 })
  }
}
