import { Suspense } from "react"
import { BoxlotFilter } from "@/components/site/BoxlotFilter"
import { PageHeader } from "@/components/site/PageHeader"
import { ProductCard } from "@/components/site/ProductCard"
import { getCurrentUser } from "@/lib/current-user"
import { getProducts } from "@/lib/data"

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Peak Blooms - Shop",
  description: "Browse our full catalog of premium flowers",
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  // Parse filter parameters
  const collectionId = typeof params.collectionId === "string" ? params.collectionId : undefined
  // Accept multiple colors passed as `colors` param (comma separated or repeated keys)
  const colors =
    typeof params.colors === "string"
      ? params.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : Array.isArray(params.colors)
        ? params.colors
        : undefined
  const stemLengthMin =
    typeof params.stemLengthMin === "string" ? parseInt(params.stemLengthMin, 10) : undefined
  const stemLengthMax =
    typeof params.stemLengthMax === "string" ? parseInt(params.stemLengthMax, 10) : undefined
  const priceMin = typeof params.priceMin === "string" ? parseFloat(params.priceMin) : undefined
  const priceMax = typeof params.priceMax === "string" ? parseFloat(params.priceMax) : undefined
  const boxlotOnly = params.boxlotOnly === "true"

  // Fetch products using DAL
  const products = await getProducts(
    {
      collectionId: collectionId || undefined,
      colors: colors,
      stemLengthMin:
        stemLengthMin !== undefined && !Number.isNaN(stemLengthMin) ? stemLengthMin : undefined,
      stemLengthMax:
        stemLengthMax !== undefined && !Number.isNaN(stemLengthMax) ? stemLengthMax : undefined,
      priceMin: priceMin !== undefined && !Number.isNaN(priceMin) ? priceMin : undefined,
      priceMax: priceMax !== undefined && !Number.isNaN(priceMax) ? priceMax : undefined,
      boxlotOnly,
    },
    multiplier
  )

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader title="Shop" description="Browse our full catalog of premium flowers" />

      {/* Filters - Horizontal Bar */}
      <div className="mb-8 flex flex-wrap gap-4 items-center">
        <Suspense fallback={null}>
          <BoxlotFilter />
        </Suspense>
        {boxlotOnly && (
          <p className="text-sm text-muted-foreground">
            Showing bulk boxlot products for large-scale event planners
          </p>
        )}
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-muted-foreground">No products found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}
