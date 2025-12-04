import { CollectionCard } from "@/components/site/CollectionCard"
import { PageHeader } from "@/components/site/PageHeader"
import { getAllCollections } from "@/lib/data"

export const metadata = {
  title: "Peak Blooms - Collections",
  description: "Browse our curated collection of premium flowers",
}

export default async function CollectionsPage() {
  const collections = await getAllCollections()

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Page Header */}
      <PageHeader
        title="Seasonal Collections"
        description="Discover our thoughtfully curated selections that celebrate what's in season. We partner with local growers and trusted suppliers to bring you the freshest flowers at their peak—supporting sustainability while maximizing quality and availability."
      />

      {/* Collections Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {collections.map((collection) => (
          <CollectionCard key={collection.slug} collection={collection} />
        ))}
      </div>
    </div>
  )
}
