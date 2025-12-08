import Link from "next/link"
import HeroesTable from "@/components/admin/HeroesTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { getTrackedDb } from "@/lib/db"

interface AdminHeroesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminHeroesPage({ searchParams }: AdminHeroesPageProps) {
  const db = getTrackedDb(true)

  const params = await searchParams
  // Parse sort params
  const sort = typeof params?.sort === "string" ? params.sort : undefined
  const order = typeof params?.order === "string" ? (params.order as "asc" | "desc") : undefined

  const heroes = await db.heroBanner.findMany({
    orderBy: [{ slotPosition: "asc" }, { createdAt: "desc" }],
  })

  // Client-side sort based on params
  if (sort === "name") {
    heroes.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name)
      return order === "desc" ? -comparison : comparison
    })
  } else if (sort === "title") {
    heroes.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title)
      return order === "desc" ? -comparison : comparison
    })
  } else if (sort === "slot") {
    heroes.sort((a, b) => {
      const aPos = a.slotPosition || 999
      const bPos = b.slotPosition || 999
      return order === "desc" ? bPos - aPos : aPos - bPos
    })
  }

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="heading-1">Hero Banners</h1>
          <p className="mt-2 text-muted-foreground">
            Manage homepage hero banners ({heroes.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/heroes/new">Add New Hero</Link>
        </Button>
      </div>

      {/* Heroes Table */}
      <HeroesTable heroes={heroes} sort={sort} order={order} />
    </>
  )
}
