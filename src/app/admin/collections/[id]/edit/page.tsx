import { notFound, redirect } from "next/navigation"
import CollectionForm from "@/components/admin/CollectionForm"
import BackLink from "@/components/site/BackLink"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

interface EditCollectionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

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
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin/collections" label="Collections" />
        <div className="mb-8">
          <p className="mt-2 text-muted-foreground">Update &ldquo;{collection.name}&rdquo;</p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <CollectionForm collection={collection} />
        </div>
      </div>
    </div>
  )
}
