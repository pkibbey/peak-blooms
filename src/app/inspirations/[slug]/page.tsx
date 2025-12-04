import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import AddAllToCartButton from "@/components/site/AddAllToCartButton"
import BackLink from "@/components/site/BackLink"
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
import { formatPrice } from "@/lib/utils"

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
    <div className="flex flex-col items-center justify-start bg-white py-12 sm:py-16 font-sans">
      <div className="w-full max-w-5xl px-4 md:px-6">
        {/* Navigation Back Link */}
        <BackLink href="/inspirations" label="inspirations" />

        {/* Header Section - Enhanced typography and spacing */}
        <div className="mb-8 md:mb-12">
          <h1 className="heading-1 text-4xl md:text-5xl mb-3 text-primary">{inspiration.name}</h1>
          <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
            {inspiration.subtitle}
          </p>
        </div>

        {/* Featured Image - Enhanced with larger aspect ratio */}
        <div className="relative aspect-video overflow-hidden rounded-lg shadow-lg mb-6 md:mb-12">
          <Image
            src={inspiration.image}
            alt={inspiration.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Inspiration Story Section - Enhanced styling */}
        <div className="mb-8 md:mb-12">
          <div className="max-w-3xl">
            <h2 className="heading-2 text-2xl md:text-3xl mb-6 text-primary flex items-center">
              <span className="w-1 h-8 bg-primary rounded-full mr-4"></span>
              The Story
            </h2>
            <p className="text-base md:text-lg leading-relaxed text-gray-700 whitespace-pre-line">
              {inspiration.inspirationText}
            </p>
          </div>
        </div>

        {/* Call to Action Section - Enhanced styling and positioning */}
        <div className="mb-8 md:mb-12 w-full">
          <div className="bg-linear-to-r from-primary/5 to-secondary/5 rounded-lg p-8 md:p-12 border border-primary/10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="heading-3 text-xl md:text-2xl text-primary mb-2">
                  Add This Set to Your Cart
                </h3>
                <p className="text-gray-600 text-sm md:text-base">
                  Get all flowers from this inspiration in one seamless order
                </p>
              </div>
              <div className="md:shrink-0">
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
        </div>

        {/* Products Section - Enhanced with better visual hierarchy */}
        <div className="w-full">
          <h2 className="heading-2 text-2xl md:text-3xl mb-2 text-primary">Flowers in This Set</h2>
          <p className="text-gray-600 mb-8 text-sm md:text-base">
            Carefully curated combinations for your inspirations
          </p>

          {/* Product Table with Enhanced Styling */}
          <div className="rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="font-semibold">Image</TableHead>
                  <TableHead className="font-semibold">Product</TableHead>
                  <TableHead className="font-semibold">Details</TableHead>
                  <TableHead className="font-semibold">Qty</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithVariants.map((product, index) => (
                  <TableRow
                    key={product.slug}
                    className={index % 2 === 0 ? "bg-white" : "bg-muted/20 hover:bg-muted/30"}
                  >
                    <TableCell className="py-4">
                      <Link href={`/shop/${product.slug}`} className="block">
                        {product.image ? (
                          <div className="relative h-20 w-20 overflow-hidden rounded-md bg-muted shadow-sm hover:shadow-md transition-shadow">
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                              sizes="80px"
                            />
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="text-primary font-semibold hover:underline text-base"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4">
                      {product.displayVariant ? (
                        <div className="text-sm">
                          <div className="font-semibold text-gray-900 mb-1">
                            {formatPrice(product.displayVariant.price)}
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {product.displayVariant.stemLength && (
                              <div>Stem length: {product.displayVariant.stemLength}cm</div>
                            )}
                            {product.displayVariant.quantityPerBunch && (
                              <div>{product.displayVariant.quantityPerBunch} per bunch</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No variant</div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center justify-center min-w-10 px-3 py-1 text-sm font-semibold bg-primary/10 text-primary rounded-full">
                        {product.quantity}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
