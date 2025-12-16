import { notFound } from "next/navigation"
import BackLink from "@/components/site/BackLink"
import { DeliveryBanner } from "@/components/site/DeliveryBanner"
import { PageHeader } from "@/components/site/PageHeader"
import { ProductItem } from "@/components/site/ProductItem"
import { getCurrentUser } from "@/lib/current-user"
import { getCollectionBySlug } from "@/lib/data"
import { db } from "@/lib/db"

interface CollectionDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: CollectionDetailPageProps) {
  const { slug } = await params
  const collection = await db.collection.findUnique({
    where: { slug },
  })
  if (!collection) return {}
  return {
    title: `${collection.name} - Collections`,
    description: collection.description,
  }
}

export default async function CollectionDetailPage({ params }: CollectionDetailPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  const collection = await getCollectionBySlug(slug, multiplier)

  if (!collection) {
    notFound()
  }

  return (
    <>
      <div className="flex flex-col items-center justify-start py-12 font-sans">
        <div className="w-full max-w-5xl px-6">
          {/* Navigation Back Link */}
          <BackLink href="/collections" label="Collections" />

          {/* Collection Header */}
          <PageHeader title={collection.name} description={collection.description ?? undefined} />

          {/* Products Section */}
          <div>
            <h2 className="text-2xl font-bold mb-6 font-serif">Products in this collection</h2>

            {collection.productCollections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No products available in this collection yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {collection.productCollections.map((pc) => (
                  <ProductItem
                    key={pc.product.slug}
                    product={pc.product}
                    user={user}
                    layout="grid"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Banner */}
      <DeliveryBanner subtitle="Order with confidence. Free regional delivery on all arrangements." />
    </>
  )
}
