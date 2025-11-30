import Link from "next/link"
import CollectionsTable from "@/components/admin/CollectionsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"

export default async function AdminCollectionsPage() {
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
      <CollectionsTable collections={collections} />
    </>
  )
}
