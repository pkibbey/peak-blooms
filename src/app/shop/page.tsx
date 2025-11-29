import { Suspense } from "react"
import { BoxlotFilter } from "@/components/site/BoxlotFilter"
import { PageHeader } from "@/components/site/PageHeader"
import { ProductCard } from "@/components/site/ProductCard"
import type { ProductWhereInput } from "@/generated/models/Product"
import { applyPriceMultiplierToProducts, getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

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

  // Build filter conditions
  const where: ProductWhereInput = {}

  const collectionId = typeof params.collectionId === "string" ? params.collectionId : undefined
  const color = typeof params.color === "string" ? params.color : undefined
  const stemLengthMin =
    typeof params.stemLengthMin === "string" ? parseInt(params.stemLengthMin, 10) : undefined
  const stemLengthMax =
    typeof params.stemLengthMax === "string" ? parseInt(params.stemLengthMax, 10) : undefined
  const priceMin = typeof params.priceMin === "string" ? params.priceMin : undefined
  const priceMax = typeof params.priceMax === "string" ? params.priceMax : undefined
  const boxlotOnly = params.boxlotOnly === "true"

  if (collectionId && collectionId !== "") {
    where.collectionId = collectionId
  }

  if (color && color !== "") {
    where.color = {
      equals: color,
      mode: "insensitive",
    }
  }

  // Filter by variant properties (stemLength range, price)
  if (stemLengthMin !== undefined || stemLengthMax !== undefined) {
    const stemLengthFilter: { gte?: number; lte?: number } = {}
    if (stemLengthMin !== undefined) {
      stemLengthFilter.gte = stemLengthMin
    }
    if (stemLengthMax !== undefined) {
      stemLengthFilter.lte = stemLengthMax
    }
    where.variants = {
      some: {
        stemLength: stemLengthFilter,
      },
    }
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    const priceFilter: { gte?: number; lte?: number } = {}
    if (priceMin !== undefined && priceMin !== "") {
      priceFilter.gte = parseFloat(priceMin)
    }
    if (priceMax !== undefined && priceMax !== "") {
      priceFilter.lte = parseFloat(priceMax)
    }
    // Merge with existing variants filter or create new one
    where.variants = {
      ...where.variants,
      some: {
        ...(where.variants?.some || {}),
        price: priceFilter,
      },
    }
  }

  // Filter by boxlot variants only
  if (boxlotOnly) {
    where.variants = {
      ...where.variants,
      some: {
        ...(where.variants?.some || {}),
        isBoxlot: true,
      },
    }
  }

  // Fetch filtered products
  const products = await db.product.findMany({
    where,
    include: {
      collection: true,
      variants: boxlotOnly
        ? {
            where: {
              isBoxlot: true,
            },
          }
        : true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  // Apply user's price multiplier to all product prices
  const multiplier = user?.priceMultiplier ?? 1.0
  const adjustedProducts = applyPriceMultiplierToProducts(products, multiplier)

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
          {adjustedProducts.map((product) => (
            <ProductCard key={product.slug} product={product} user={user} />
          ))}
        </div>
      )}
    </div>
  )
}
