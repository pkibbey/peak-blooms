import ProductForm from "@/components/admin/ProductForm"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

export default async function NewProductPage() {
  const collections = await db.collection.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <>
      <BackLink href="/admin/products" label="Products" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Add New Product</h1>
        <p className="mt-2 text-muted-foreground">Create a new product listing</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <ProductForm collections={collections} />
      </div>
    </>
  )
}
