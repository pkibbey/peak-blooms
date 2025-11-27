import Link from "next/link"
import { InspirationCard } from "@/components/site/InspirationCard"
import { db } from "@/lib/db"

export default async function FeaturedInspiration() {
  const inspirations = await db.inspiration.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold font-serif">Inspirations</h2>
            <p className="mt-2 text-muted-foreground">
              Discover curated flower arrangements designed to inspire and delight
            </p>
          </div>
          <Link href="/inspirations" className="text-sm font-medium text-primary hover:underline">
            View all inspirations →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {inspirations.map((inspiration) => (
            <InspirationCard key={inspiration.slug} inspiration={inspiration} />
          ))}
        </div>
      </div>
    </div>
  )
}
