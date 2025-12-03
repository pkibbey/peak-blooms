import Link from "next/link"
import CollectionsTable from "@/components/admin/CollectionsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"

interface AdminCollectionsPageProps {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function AdminCollectionsPage({ searchParams }: AdminCollectionsPageProps) {
  // Parse sort params
  const sort = typeof searchParams?.sort === "string" ? searchParams.sort : undefined
  const order =
    typeof searchParams?.order === "string" ? (searchParams.order as "asc" | "desc") : undefined

  const collections = await db.collection.findMany({
    include: {
      _count: {
        select: { products: true },
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
      const aCount = a._count?.products || 0
      const bCount = b._count?.products || 0
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
        <Button asChild>
          <Link href="/admin/collections/new">Add New Collection</Link>
        </Button>
      </div>

      {/* Collections Table */}
      <CollectionsTable collections={collections} sort={sort} order={order} />
    </>
  )
}
