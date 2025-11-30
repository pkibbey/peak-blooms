import { notFound } from "next/navigation"
import CollectionForm from "@/components/admin/CollectionForm"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

interface EditCollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { id } = await params

  const collection = await db.collection.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  })

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
        <CollectionForm collection={collection} />
      </div>
    </>
  )
}
