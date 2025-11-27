import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import InspirationForm from "@/components/admin/InspirationForm"
import BackLink from "@/components/site/BackLink"

export default async function NewInspirationPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

  const products = await db.product.findMany({
    include: {
      collection: {
        select: { name: true },
      },
      variants: true,
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin/inspirations" label="Inspirations" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Inspiration</h1>
          <p className="mt-2 text-muted-foreground">Create a new inspiration</p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <InspirationForm products={products} />
        </div>
      </div>
    </div>
  )
}
