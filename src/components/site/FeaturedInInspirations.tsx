import { InspirationCard } from "@/components/site/InspirationCard"
import type { InspirationModel } from "@/generated/models"

interface InspirationJoin {
  inspiration: InspirationModel & {
    _count?: { products: number }
  }
}

interface FeaturedInInspirationsProps {
  inspirations: InspirationJoin[]
}

export function FeaturedInInspirations({ inspirations }: FeaturedInInspirationsProps) {
  if (!inspirations || inspirations.length === 0) {
    return null
  }

  // Extract unique inspirations from the join table entries
  const uniqueInspirations = inspirations.reduce((acc, isp) => {
    if (!acc.find((s) => s.id === isp.inspiration.id)) {
      acc.push(isp.inspiration)
    }
    return acc
  }, [] as InspirationModel[])

  return (
    <div className="mt-12 pt-8">
      <h2 className="text-2xl font-bold font-serif mb-8">Featured in These Inspirations</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {uniqueInspirations.map((inspiration) => (
          <InspirationCard key={inspiration.id} inspiration={inspiration} />
        ))}
      </div>
    </div>
  )
}
