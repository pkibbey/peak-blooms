import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import BackLink from "@/components/site/BackLink"
import { FeaturedInInspirations } from "@/components/site/FeaturedInInspirations"
import { ProductControls } from "@/components/site/ProductControls"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

interface ProductDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const products = await db.product.findMany({
    select: { slug: true },
  })
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

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      collection: true,
      inspirations: {
        include: {
          inspiration: {
            include: {
              _count: {
                select: { products: true },
              },
            },
          },
        },
      },
      variants: true,
    },
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
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
              <span className="mx-2">/</span>
              <Link href={`/collections/${product.collection.slug}`} className="hover:underline">
                {product.collection.name}
              </Link>
              <span className="mx-2">/</span>
              <span>{product.name}</span>
            </div>

            {/* Product Title */}
            <div>
              <h1 className="text-4xl font-extrabold font-serif mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.collection.name}</p>
            </div>

            {/* Description */}
            <div>
              <p className="text-lg text-muted-foreground">{product.description}</p>
            </div>

            {/* Product Controls */}
            <ProductControls product={product} user={user} mode="detail" />
          </div>
        </div>

        {/* Featured in Inspirations */}
        <FeaturedInInspirations inspirations={product.inspirations} />
      </div>
    </div>
  )
}
