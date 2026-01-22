import Link from "next/link"
import { notFound } from "next/navigation"
import ProductForm from "@/components/admin/ProductForm"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { getTrackedDb } from "@/lib/db"

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  const [product, collections, allProducts] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        productCollections: {
          select: { collectionId: true },
        },
      },
    }),
    db.collection.findMany({
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!product) {
    notFound()
  }

  // Find current product index
  const currentIndex = allProducts.findIndex((p) => p.id === id)
  const previousProduct = currentIndex > 0 ? allProducts[currentIndex - 1] : null
  const nextProduct = currentIndex < allProducts.length - 1 ? allProducts[currentIndex + 1] : null

  // Transform product to include collectionIds array for the form
  const productForForm = {
    ...product,
    collectionIds: product.productCollections.map((pc) => pc.collectionId),
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <BackLink href="/admin/products" label="Products" className="mb-0" />
        <div className="flex gap-2 ml-auto">
          {previousProduct ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/products/${previousProduct.id}/edit`}>← Previous</Link>}
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              ← Previous
            </Button>
          )}
          {nextProduct ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<Link href={`/admin/products/${nextProduct.id}/edit`}>Next →</Link>}
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next →
            </Button>
          )}
        </div>
      </div>
      <div className="mb-8">
        <h1 className="heading-1">Edit Product</h1>
        <p className="mt-2 text-muted-foreground">Update &ldquo;{product.name}&rdquo;</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <ProductForm collections={collections} product={productForForm} />
      </div>
    </>
  )
}
