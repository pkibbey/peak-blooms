import ProductForm from "@/components/admin/ProductForm"
import BackLink from "@/components/site/BackLink"
import { getTrackedDb } from "@/lib/db"

export default async function NewProductPage() {
  const db = getTrackedDb(true)

  const collections = await db.collection.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <>
      <BackLink href="/admin/products" label="Products" />
      <div className="mb-8">
        <h1 className="heading-1">Add New Product</h1>
        <p className="mt-2 text-muted-foreground">Create a new product listing</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <ProductForm collections={collections} />
      </div>
    </>
  )
}
