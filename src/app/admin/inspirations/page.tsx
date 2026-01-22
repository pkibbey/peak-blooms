import Link from "next/link"
import InspirationsTable from "@/components/admin/InspirationsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { getTrackedDb } from "@/lib/db"

interface AdminInspirationsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminInspirationsPage({ searchParams }: AdminInspirationsPageProps) {
  const db = getTrackedDb(true)

  const params = await searchParams
  // Parse sort params
  const sort = typeof params?.sort === "string" ? params.sort : undefined
  const order = typeof params?.order === "string" ? (params.order as "asc" | "desc") : undefined

  const inspirations = await db.inspiration.findMany({
    include: {
      _count: {
        select: { products: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Client-side sort based on params
  if (sort === "name") {
    inspirations.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name)
      return order === "desc" ? -comparison : comparison
    })
  } else if (sort === "products") {
    inspirations.sort((a, b) => {
      const aCount = a._count.products || 0
      const bCount = b._count.products || 0
      return order === "desc" ? bCount - aCount : aCount - bCount
    })
  } else if (sort === "slug") {
    inspirations.sort((a, b) => {
      const comparison = a.slug.localeCompare(b.slug)
      return order === "desc" ? -comparison : comparison
    })
  }

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="heading-1">Inspirations</h1>
          <p className="mt-2 text-muted-foreground">
            Curate inspirations ({inspirations.length} total)
          </p>
        </div>
        <Button
          nativeButton={false}
          render={<Link href="/admin/inspirations/new">Add New Inspiration</Link>}
        />
      </div>

      {/* Inspirations Table */}
      <InspirationsTable inspirations={inspirations} sort={sort} order={order} />
    </>
  )
}
