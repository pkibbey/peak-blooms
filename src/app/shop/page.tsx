import { db } from "@/lib/db"
import { ProductCard } from "@/components/site/ProductCard"
import type { ProductWhereInput } from "@/generated/models/Product"
import ShopFilters from "@/components/site/ShopFilters"
import { getCurrentUser } from "@/lib/auth-utils"

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Peak Blooms - Shop",
  description: "Browse our full catalog of premium flowers",
}

// Fetch filter options (colors and stem lengths) from database
async function getFilterOptions() {
  const [colors, stemLengths] = await Promise.all([
    db.product.findMany({
      where: {
        color: {
          not: null,
        },
      },
      distinct: ["color"],
      select: {
        color: true,
      },
    }),
    // Get stem lengths from variants
    db.productVariant.findMany({
      where: {
        stemLength: {
          not: null,
        },
      },
      distinct: ["stemLength"],
      select: {
        stemLength: true,
      },
      orderBy: {
        stemLength: "asc",
      },
    }),
  ])

  const distinctColors = colors
    .map((p) => p.color)
    .filter((color): color is string => color !== null)
    .sort()

  const distinctStemLengths = stemLengths
    .map((v) => v.stemLength)
    .filter((length): length is number => length !== null)
    .sort((a, b) => a - b)

  return {
    colors: distinctColors,
    stemLengths: distinctStemLengths,
  }
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const user = await getCurrentUser()

  // Get all categories and filter options in parallel
  const [categories, filterOptions] = await Promise.all([
    db.category.findMany({
      orderBy: { name: "asc" },
    }),
    getFilterOptions(),
  ])

  // Build filter conditions
  const where: ProductWhereInput = {}

  const categoryId = typeof params.categoryId === "string" ? params.categoryId : undefined
  const color = typeof params.color === "string" ? params.color : undefined
  const stemLength = typeof params.stemLength === "string" ? params.stemLength : undefined
  const priceMin = typeof params.priceMin === "string" ? params.priceMin : undefined
  const priceMax = typeof params.priceMax === "string" ? params.priceMax : undefined

  if (categoryId && categoryId !== "") {
    where.categoryId = categoryId
  }

  if (color && color !== "") {
    where.color = {
      equals: color,
      mode: "insensitive",
    }
  }

  // Filter by variant properties (stemLength, price)
  if (stemLength !== undefined && stemLength !== "") {
    where.variants = {
      some: {
        stemLength: parseInt(stemLength, 10),
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
      category: true,
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
        <ShopFilters
          categories={categories}
          user={userObj}
          colors={filterOptions.colors}
          stemLengths={filterOptions.stemLengths}
        />

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
