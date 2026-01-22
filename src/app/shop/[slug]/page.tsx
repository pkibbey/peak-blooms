import Link from "next/link"
import { notFound } from "next/navigation"
import BackLink from "@/components/site/BackLink"
import { DeliveryBanner } from "@/components/site/DeliveryBanner"
import { FeaturedInInspirations } from "@/components/site/FeaturedInInspirations"
import { ImageGallery } from "@/components/site/ImageGallery"
import { ProductControls } from "@/components/site/ProductControls"
import { ColorsMiniDisplay } from "@/components/ui/ColorsMiniDisplay"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/current-user"
import { getProductWithInspirations } from "@/lib/data"
import { db } from "@/lib/db"

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>
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

  // Fetch current cart quantity and item ID for this product
  let currentCartQuantity = 0
  let cartItemId: string | undefined
  if (user) {
    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      include: { items: true },
    })
    const cartItem = cart?.items?.find((item) => item.productId === product.id)
    currentCartQuantity = cartItem?.quantity ?? 0
    cartItemId = cartItem?.id
  }

  return (
    <>
      <div className="flex flex-col items-center justify-start py-12 font-sans">
        <div className="w-full max-w-5xl px-6">
          {/* Navigation Back Link */}
          <BackLink href="/shop" label="shop" />

          {/* Product Detail Grid */}
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            {/* Product Image Gallery */}
            <ImageGallery
              images={product.images.map((url, i) => ({ url, order: i }))}
              productName={product.name}
              fallbackImage={product.images[0] ?? undefined}
            />

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
              {product.colors.length > 0 && (
                <div className="grid gap-2">
                  <Label>Colors</Label>
                  <ColorsMiniDisplay colorIds={product.colors} size="md" />
                </div>
              )}
              {/* Product Controls */}
              <ProductControls
                product={product}
                user={user}
                mode="detail"
                currentCartQuantity={currentCartQuantity}
                cartItemId={cartItemId}
              />
            </div>
          </div>

          {/* Featured in Inspirations */}
          <FeaturedInInspirations inspirations={product.inspirations} />
        </div>
      </div>

      {/* Delivery Banner */}
      <DeliveryBanner subtitle="Order with confidence. Free regional delivery on all arrangements." />
    </>
  )
}
