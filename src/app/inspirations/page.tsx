import { InspirationCard } from "@/components/site/InspirationCard"
import { PageHeader } from "@/components/site/PageHeader"
import { db } from "@/lib/db"

export const metadata = {
  title: "Peak Blooms - Inspirations",
  description: "Explore our curated flower arrangements for inspiration and delight.",
}

export default async function InspirationPage() {
  const inspirations = await db.inspiration.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <PageHeader
        title="Inspirations"
        description="Curated flower arrangements designed by our artisans to inspire and delight."
      />

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {inspirations.map((inspiration) => (
          <InspirationCard key={inspiration.slug} inspiration={inspiration} />
        ))}
      </div>
    </div>
  )
}
