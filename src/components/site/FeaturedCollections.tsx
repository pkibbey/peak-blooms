import Link from "next/link"
import { CollectionCard } from "@/components/site/CollectionCard"
import { getFeaturedCollections } from "@/lib/data/collections"

import type { CollectionBasic } from "@/lib/query-types"

export default async function FeaturedCollections() {
  let collections: CollectionBasic[] = []
  try {
    collections = await getFeaturedCollections()
  } catch (_error) {
    collections = []
  }

  return (
    <div className="flex flex-col items-center justify-start bg-background py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="flex items-end justify-between">
          <h2 className="text-3xl font-extrabold font-serif">Featured Collections</h2>
          <Link
            href="/collections"
            className="text-sm font-medium text-primary hover:underline shrink-0"
          >
            View all collections →
          </Link>
        </div>
        <p className="mt-2 text-muted-foreground mb-6">
          Thoughtfully curated collections celebrating what's in season.
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {collections.length === 0 ? (
            <div className="text-center text-muted-foreground">
              No featured collections available.
            </div>
          ) : (
            collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
