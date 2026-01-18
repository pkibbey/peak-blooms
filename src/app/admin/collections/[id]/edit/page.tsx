import Link from "next/link"
import { notFound } from "next/navigation"
import CollectionForm from "@/components/admin/CollectionForm"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { getTrackedDb } from "@/lib/db"

interface EditCollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  const [collection, products, allCollections] = await Promise.all([
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
      },
      orderBy: { name: "asc" },
    }),
    db.collection.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!collection) {
    notFound()
  }

  // Find current collection index
  const currentIndex = allCollections.findIndex((c) => c.id === id)
  const previousCollection = currentIndex > 0 ? allCollections[currentIndex - 1] : null
  const nextCollection =
    currentIndex < allCollections.length - 1 ? allCollections[currentIndex + 1] : null

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <BackLink href="/admin/collections" label="Collections" className="mb-0" />
        <div className="flex gap-2 ml-auto">
          {previousCollection ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link prefetch={false} href={`/admin/collections/${previousCollection.id}/edit`}>
                  ← Previous
                </Link>
              }
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              ← Previous
            </Button>
          )}
          {nextCollection ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link prefetch={false} href={`/admin/collections/${nextCollection.id}/edit`}>
                  Next →
                </Link>
              }
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next →
            </Button>
          )}
        </div>
      </div>
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
