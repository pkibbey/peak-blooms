import { notFound } from "next/navigation"
import InspirationForm from "@/components/admin/InspirationForm"
import BackLink from "@/components/site/BackLink"
import { db } from "@/lib/db"

interface EditInspirationPageProps {
  params: Promise<{ id: string }>
}

export default async function EditInspirationPage({ params }: EditInspirationPageProps) {
  const { id } = await params

  const [inspiration, products] = await Promise.all([
    db.inspiration.findUnique({
      where: { id },
      include: {
        products: {
          select: {
            productId: true,
            productVariantId: true,
            quantity: true,
          },
        },
      },
    }),
    db.product.findMany({
      include: {
        collection: {
          select: { name: true },
        },
        variants: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  if (!inspiration) {
    notFound()
  }

  return (
    <>
      <BackLink href="/admin/inspirations" label="Inspirations" />
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
