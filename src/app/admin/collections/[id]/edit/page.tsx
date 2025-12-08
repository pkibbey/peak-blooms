import { notFound } from "next/navigation"
import CollectionForm from "@/components/admin/CollectionForm"
import BackLink from "@/components/site/BackLink"
import { getTrackedDb } from "@/lib/db"

interface EditCollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  const [collection, products] = await Promise.all([
    db.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { productCollections: true },
        },
        productCollections: {
          select: {
            productId: true,
          },
        },
      },
    }),
    db.product.findMany({
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
    }),
  ])

  if (!collection) {
    notFound()
  }

  return (
    <>
      <BackLink href="/admin/collections" label="Collections" />
      <div className="mb-8">
        <h1 className="heading-1">Edit Collection</h1>
        <p className="mt-2 text-muted-foreground">Update &ldquo;{collection.name}&rdquo;</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <CollectionForm collection={collection} products={products} />
      </div>
    </>
  )
}
