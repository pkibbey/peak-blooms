import { notFound } from "next/navigation"
import BackLink from "@/components/site/BackLink"
import { PageHeader } from "@/components/site/PageHeader"
import { ProductCard } from "@/components/site/ProductCard"
import { applyPriceMultiplierToProducts, getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

interface CollectionDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const collections = await db.collection.findMany({
    select: { slug: true },
  })
  return collections.map((collection) => ({
    slug: collection.slug,
  }))
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

  const collection = await db.collection.findUnique({
    where: { slug },
    include: {
      products: {
        orderBy: {
          createdAt: "desc",
        },
        include: {
          variants: true,
        },
      },
    },
  })

  if (!collection) {
    notFound()
  }

  // Apply user's price multiplier to all product prices
  const multiplier = user?.priceMultiplier ?? 1.0
  const adjustedProducts = applyPriceMultiplierToProducts(collection.products, multiplier)

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        {/* Navigation Back Link */}
        <BackLink href="/admin/collections" label="Collections" />

        {/* Collection Header */}
        <PageHeader title={collection.name} description={collection.description ?? undefined} />

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6 font-serif">Products in this collection</h2>

          {adjustedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products available in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {adjustedProducts.map((product) => (
                <ProductCard key={product.slug} product={product} user={user} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
