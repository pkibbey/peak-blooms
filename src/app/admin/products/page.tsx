import Link from "next/link"
import ProductsTable from "@/components/admin/ProductsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/db"

export default async function AdminProductsPage() {
  const products = await db.product.findMany({
    include: {
      collection: true,
      variants: {
        select: {
          id: true,
          price: true,
        },
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
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your product catalog ({products.length} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add New Product</Link>
        </Button>
      </div>

      <ProductsTable products={products} />
    </>
  )
}
