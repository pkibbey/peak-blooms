import { db } from "@/lib/db"
import { ProductCard } from "@/components/site/ProductCard"
import ShopFilters from "@/components/site/ShopFilters"
import { getCurrentUser } from "@/lib/auth-utils"

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Shop",
  description: "Browse our full catalog of premium flowers",
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const user = await getCurrentUser()

  // Get all categories
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  })

  // Build filter conditions
  const where: any = {}

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

  if (stemLength !== undefined && stemLength !== "") {
    where.stemLength = parseInt(stemLength, 10)
  }

  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {}
    if (priceMin !== undefined && priceMin !== "") {
      where.price.gte = parseFloat(priceMin)
    }
    if (priceMax !== undefined && priceMax !== "") {
      where.price.lte = parseFloat(priceMax)
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

        {/* Filters */}
        <ShopFilters categories={categories} user={userObj} />

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">No products found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} user={userObj} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
