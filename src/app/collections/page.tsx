import { CollectionCard } from "@/components/site/CollectionCard"
import { db } from "@/lib/db"

export const metadata = {
  title: "Peak Blooms - Collections",
  description: "Browse our curated collection of premium flowers",
}

export default async function CollectionsPage() {
  const collections = await db.collection.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold font-serif">Collections</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Discover our curated selection of premium flower collections
        </p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {collections.map((collection) => (
          <CollectionCard key={collection.slug} collection={collection} />
        ))}
      </div>
    </div>
  )
}
