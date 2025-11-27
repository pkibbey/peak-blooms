import Link from "next/link"
import InspirationsTable from "@/components/admin/InspirationsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"

export default async function AdminInspirationsPage() {
  const inspirations = await db.inspiration.findMany({
    include: {
      products: {
        select: { id: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inspirations</h1>
          <p className="mt-2 text-muted-foreground">
            Curate inspirations ({inspirations.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/inspirations/new">Add New Inspiration</Link>
        </Button>
      </div>

      {/* Inspirations Table */}
      <InspirationsTable inspirations={inspirations} />
    </>
  )
}
