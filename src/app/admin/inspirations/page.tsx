import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import InspirationsTable from "@/components/admin/InspirationsTable"
import BackLink from "@/components/site/BackLink"

export default async function AdminInspirationsPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

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
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
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
      </div>
    </div>
  )
}
