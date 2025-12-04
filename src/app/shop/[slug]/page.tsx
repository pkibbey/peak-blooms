import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import BackLink from "@/components/site/BackLink"
import { FeaturedInInspirations } from "@/components/site/FeaturedInInspirations"
import { ProductControls } from "@/components/site/ProductControls"
import { ShippingBanner } from "@/components/site/ShippingBanner"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/current-user"
import { getAllProductSlugs, getProductWithInspirations } from "@/lib/data"
import { db } from "@/lib/db"

interface ProductDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const products = await getAllProductSlugs()
  return products.map((product) => ({
    slug: product.slug,
  }))
}

export async function generateMetadata({ params }: ProductDetailPageProps) {
  const { slug } = await params
  const product = await db.product.findUnique({
    where: { slug },
  })
  if (!product) return {}
  return {
    title: `${product.name} - Shop`,
    description: product.description,
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  const product = await getProductWithInspirations(slug, multiplier)

  if (!product) {
    notFound()
  }

  return (
    <>
      <div className="flex flex-col items-center justify-start bg-white py-12 font-sans">
        <div className="w-full max-w-5xl px-6">
          {/* Navigation Back Link */}
          <BackLink href="/shop" label="shop" />

          {/* Product Detail Grid */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Product Image */}
            <div className="flex items-center justify-center">
              <div className="relative w-full aspect-square overflow-hidden rounded-xs bg-zinc-200">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="flex flex-col justify-start gap-6">
              {/* Breadcrumb */}
              <div className="text-sm text-muted-foreground">
                <Link href="/shop" className="hover:underline">
                  Shop
                </Link>
                {product.productCollections.length > 0 && (
                  <>
                    <span className="mx-2">/</span>
                    <Link
                      href={`/collections/${product.productCollections[0].collection.slug}`}
                      className="hover:underline"
                    >
                      {product.productCollections[0].collection.name}
                    </Link>
                  </>
                )}
                <span className="mx-2">/</span>
                <span>{product.name}</span>
              </div>

              {/* Product Title */}
              <div>
                <h1 className="text-4xl font-extrabold font-serif mb-2">{product.name}</h1>
                {/* Description */}
                <p className="text-lg text-muted-foreground">{product.description}</p>
              </div>
              <div className="grid gap-2">
                <Label>Colors</Label>
                <ColorsMiniDisplay colorIds={product.colors} size="md" />
              </div>

              {/* Product Controls */}
              <ProductControls product={product} user={user} mode="detail" />
            </div>
          </div>

          {/* Featured in Inspirations */}
          <FeaturedInInspirations inspirations={product.inspirations} />
        </div>
      </div>

      {/* Shipping Banner */}
      <ShippingBanner
        subtitle="Order with confidence. Free regional delivery on all arrangements."
        gradientPreset="rose"
      />
    </>
  )
}
