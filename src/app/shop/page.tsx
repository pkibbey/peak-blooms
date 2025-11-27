import { db } from "@/lib/db"
import { ProductCard } from "@/components/site/ProductCard"
import type { ProductWhereInput } from "@/generated/models/Product"
import { getCurrentUser } from "@/lib/auth-utils"

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
  const stemLengthMin = typeof params.stemLengthMin === "string" ? parseInt(params.stemLengthMin, 10) : undefined
  const stemLengthMax = typeof params.stemLengthMax === "string" ? parseInt(params.stemLengthMax, 10) : undefined
  const priceMin = typeof params.priceMin === "string" ? params.priceMin : undefined
  const priceMax = typeof params.priceMax === "string" ? params.priceMax : undefined

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

  // Fetch filtered products
  const products = await db.product.findMany({
    where,
    include: {
      collection: true,
      variants: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const userObj = user
    ? {
        role: user.role as "CUSTOMER" | "ADMIN",
        approved: user.approved || false,
        email: user.email,
        name: user.name,
      }
    : null

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold font-serif">Shop</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Browse our full catalog of premium flowers
          </p>
        </div>

        {/* Filters - Horizontal Bar */}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">No products found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} user={userObj} />
            ))}
          </div>
        )}
    </div>
    </div>
  )
}
