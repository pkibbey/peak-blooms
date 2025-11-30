import { notFound } from "next/navigation"
import ProductForm from "@/components/admin/ProductForm"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params

  const [product, collections] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ stemLength: "asc" }, { countPerBunch: "asc" }],
        },
      },
    }),
    db.collection.findMany({
      orderBy: { name: "asc" },
    }),
  ])

  if (!product) {
    notFound()
  }

  return (
    <>
      <BackLink href="/admin/products" label="Products" />
      <div className="mb-8">
        <h1 className="heading-1">Edit Product</h1>
        <p className="mt-2 text-muted-foreground">Update &ldquo;{product.name}&rdquo;</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <ProductForm collections={collections} product={product} />
      </div>
    </>
  )
}
