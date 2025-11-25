import { db } from "@/lib/db"

export async function GET() {
  try {
    const [colors, stemLengths] = await Promise.all([
      db.product.findMany({
        where: {
          color: {
            not: null,
          },
        },
        distinct: ["color"],
        select: {
          color: true,
        },
      }),
      db.product.findMany({
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

    const distinctColors = colors
      .map((p) => p.color)
      .filter((color): color is string => color !== null)
      .sort()

    const distinctStemLengths = stemLengths
      .map((p) => p.stemLength)
      .filter((length): length is number => length !== null)
      .sort((a, b) => a - b)

    return Response.json({
      colors: distinctColors,
      stemLengths: distinctStemLengths,
    })
  } catch (error) {
    console.error("Error fetching filter options:", error)
    return Response.json(
      { error: "Failed to fetch filter options" },
      { status: 500 }
    )
  }
}
