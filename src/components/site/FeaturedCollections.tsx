import Link from "next/link"
import { CollectionCard } from "@/components/site/CollectionCard"
import { db } from "@/lib/db"

export default async function FeaturedCollections() {
  const collections = await db.collection.findMany({
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
            <h2 className="text-3xl font-extrabold font-serif">Featured Collections</h2>
            <p className="mt-2 text-muted-foreground">
              Discover our curated selection of premium flower collections
            </p>
          </div>
          <Link href="/collections" className="text-sm font-medium text-primary hover:underline">
            View all collections →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      </div>
    </div>
  )
}
