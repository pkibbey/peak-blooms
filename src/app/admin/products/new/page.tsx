import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import ProductForm from "@/components/admin/ProductForm"
import BackLink from "@/components/site/BackLink"

export default async function NewProductPage() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

  const collections = await db.collection.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin/products" label="Products" />
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="mt-2 text-muted-foreground">Create a new product listing</p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <ProductForm collections={collections} />
        </div>
      </div>
    </div>
  )
}
