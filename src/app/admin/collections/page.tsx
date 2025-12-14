import Link from "next/link"
import CollectionsTable from "@/components/admin/CollectionsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { getTrackedDb } from "@/lib/db"

interface AdminCollectionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminCollectionsPage({ searchParams }: AdminCollectionsPageProps) {
  const db = getTrackedDb(true)

  const params = await searchParams
  // Parse sort params
  const sort = typeof params?.sort === "string" ? params.sort : undefined
  const order = typeof params?.order === "string" ? (params.order as "asc" | "desc") : undefined

  const collections = await db.collection.findMany({
    include: {
      _count: {
        select: { productCollections: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  // Client-side sort based on params
  if (sort === "name") {
    collections.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name)
      return order === "desc" ? -comparison : comparison
    })
  } else if (sort === "products") {
    collections.sort((a, b) => {
      const aCount = a._count?.productCollections || 0
      const bCount = b._count?.productCollections || 0
      return order === "desc" ? bCount - aCount : aCount - bCount
    })
  } else if (sort === "slug") {
    collections.sort((a, b) => {
      const comparison = a.slug.localeCompare(b.slug)
      return order === "desc" ? -comparison : comparison
    })
  }

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="heading-1">Collections</h1>
          <p className="mt-2 text-muted-foreground">
            Organize products into collections ({collections.length} total)
          </p>
        </div>
        <Button
          nativeButton={false}
          render={
            <Link prefetch={false} href="/admin/collections/new">
              Add New Collection
            </Link>
          }
        />
      </div>

      {/* Collections Table */}
      <CollectionsTable collections={collections} sort={sort} order={order} />
    </>
  )
}
