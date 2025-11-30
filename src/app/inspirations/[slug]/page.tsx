import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import AddAllToCartButton from "@/components/site/AddAllToCartButton"
import BackLink from "@/components/site/BackLink"
import { PageHeader } from "@/components/site/PageHeader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentUser } from "@/lib/current-user"
import { getAllInspirationSlugs, getInspirationBySlug } from "@/lib/data"
import { db } from "@/lib/db"

interface InspirationDetailPageProps {
  params: Promise<{
    slug: string
  }>
}

export async function generateStaticParams() {
  const inspirations = await getAllInspirationSlugs()
  return inspirations.map((inspiration) => ({
    slug: inspiration.slug,
  }))
}

export async function generateMetadata({ params }: InspirationDetailPageProps) {
  const { slug } = await params
  const inspiration = await db.inspiration.findUnique({
    where: { slug },
  })
  if (!inspiration) return {}
  return {
    title: `${inspiration.name} - Inspirations`,
    description: inspiration.subtitle,
  }
}

export default async function InspirationDetailPage({ params }: InspirationDetailPageProps) {
  const { slug } = await params
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  const inspiration = await getInspirationBySlug(slug, multiplier)

  if (!inspiration) {
    notFound()
  }

  // Extract products with their selected variants from the join table
  // Prices are already adjusted by the DAL
  const productsWithVariants = inspiration.products.map((sp) => ({
    ...sp.product,
    selectedVariant: sp.productVariant,
    // Use the selected variant or fall back to first variant
    displayVariant: sp.productVariant ?? sp.product.variants[0] ?? null,
    quantity: sp.quantity ?? 1,
  }))

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        {/* Navigation Back Link */}
        <BackLink href="/inspirations" label="inspirations" className="mb-8" />

        {/* Featured Image */}
        <div className="relative aspect-video overflow-hidden rounded-xs shadow-md mb-12">
          <Image
            src={inspiration.image}
            alt={inspiration.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Set Title and Subtitle */}
        <PageHeader title={inspiration.name} description={inspiration.subtitle} />

        {/* Inspiration Text */}
        <div className="mb-12 p-6 bg-secondary/30 rounded-xs">
          <h2 className="heading-2 mb-4">The Story</h2>
          <p className="text-base leading-relaxed text-gray-700">{inspiration.inspirationText}</p>
        </div>

        {/* Products Section */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Flowers in This Set</h2>

          {/* Product Checklist Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Variant</TableHead>
                  <TableHead>Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithVariants.map((product) => (
                  <TableRow key={product.slug}>
                    <TableCell>
                      <Link href={`/shop/${product.slug}`} className="block">
                        {product.image ? (
                          <div className="relative h-16 w-16 overflow-hidden rounded-sm bg-muted">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-sm bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/shop/${product.slug}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {product.displayVariant ? (
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium">
                            ${product.displayVariant.price.toFixed(2)}
                          </div>
                          <div className="text-xs">
                            {product.displayVariant.stemLength
                              ? `${product.displayVariant.stemLength}cm`
                              : ""}
                            {product.displayVariant.stemLength &&
                            product.displayVariant.countPerBunch
                              ? " · "
                              : ""}
                            {product.displayVariant.countPerBunch
                              ? `${product.displayVariant.countPerBunch} stems`
                              : ""}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No variant</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center justify-center min-w-8 px-2 py-1 text-sm font-medium bg-secondary rounded">
                        ×{product.quantity}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add All to Cart Button */}
        <div className="mt-12">
          <AddAllToCartButton
            productIds={productsWithVariants.map((p) => p.id)}
            productVariantIds={productsWithVariants.map((p) => p.displayVariant?.id ?? null)}
            quantities={productsWithVariants.map((p) => p.quantity)}
            setName={inspiration.name}
            user={user}
          />
        </div>
      </div>
    </div>
  )
}
