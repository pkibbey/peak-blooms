import { InspirationCard } from "@/components/site/InspirationCard"
import { PageHeader } from "@/components/site/PageHeader"
import { ShippingBanner } from "@/components/site/ShippingBanner"
import { getInspirationsWithCounts } from "@/lib/data"

export const metadata = {
  title: "Peak Blooms - Inspirations",
  description: "Explore our curated flower arrangements for inspiration and delight.",
}

export default async function InspirationPage() {
  const inspirations = await getInspirationsWithCounts()

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <PageHeader
          title="Inspirations"
          description="Expert arrangement ideas crafted to inspire and delight. Our artisan-designed collections serve as reference points for your own creations, showcasing design possibilities and professional-grade execution."
        />

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {inspirations.map((inspiration) => (
            <InspirationCard key={inspiration.slug} inspiration={inspiration} />
          ))}
        </div>
      </div>

      <ShippingBanner />
    </>
  )
}
