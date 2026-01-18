import Link from "next/link"
import { notFound } from "next/navigation"
import InspirationForm from "@/components/admin/InspirationForm"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { getTrackedDb } from "@/lib/db"

interface EditInspirationPageProps {
  params: Promise<{ id: string }>
}

export default async function EditInspirationPage({ params }: EditInspirationPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  const [inspiration, products, allInspirations] = await Promise.all([
    db.inspiration.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            productId: true,
            quantity: true,
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
    db.inspiration.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!inspiration) {
    notFound()
  }

  // Find current inspiration index
  const currentIndex = allInspirations.findIndex((i) => i.id === id)
  const previousInspiration = currentIndex > 0 ? allInspirations[currentIndex - 1] : null
  const nextInspiration =
    currentIndex < allInspirations.length - 1 ? allInspirations[currentIndex + 1] : null

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <BackLink href="/admin/inspirations" label="Inspirations" className="mb-0" />
        <div className="flex gap-2 ml-auto">
          {previousInspiration ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link prefetch={false} href={`/admin/inspirations/${previousInspiration.id}/edit`}>
                  ← Previous
                </Link>
              }
            />
          ) : (
            <Button variant="outline" size="sm" disabled>
              ← Previous
            </Button>
          )}
          {nextInspiration ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link prefetch={false} href={`/admin/inspirations/${nextInspiration.id}/edit`}>
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
        <h1 className="heading-1">Edit Inspiration</h1>
        <p className="mt-2 text-muted-foreground">Update &ldquo;{inspiration.name}&rdquo;</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <InspirationForm products={products} inspiration={inspiration} />
      </div>
    </>
  )
}
