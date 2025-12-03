import InspirationForm from "@/components/admin/InspirationForm"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

export default async function NewInspirationPage() {
  const products = await db.product.findMany({
    include: {
      productCollections: {
        include: {
          collection: {
            select: { name: true },
          },
        },
      },
      variants: true,
    },
    orderBy: { name: "asc" },
  })

  return (
    <>
      <BackLink href="/admin/inspirations" label="Inspirations" />
      <div className="mb-8">
        <h1 className="heading-1">Add New Inspiration</h1>
        <p className="mt-2 text-muted-foreground">Create a new inspiration</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <InspirationForm products={products} />
      </div>
    </>
  )
}
