import Link from "next/link"
import HeroesTable from "@/components/admin/HeroesTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"

export default async function AdminHeroesPage() {
  const heroes = await db.heroBanner.findMany({
    orderBy: [{ slotPosition: "asc" }, { createdAt: "desc" }],
  })

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hero Banners</h1>
          <p className="mt-2 text-muted-foreground">
            Manage homepage hero banners ({heroes.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/heroes/new">Add New Hero</Link>
        </Button>
      </div>

      {/* Heroes Table */}
      <HeroesTable heroes={heroes} />
    </>
  )
}
