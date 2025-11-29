import Link from "next/link"
import { applyPriceMultiplierToProducts, getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import { ProductCard } from "./ProductCard"

export default async function FeaturedProducts() {
  const user = await getCurrentUser()
  const products = await db.product.findMany({
    where: {
      featured: true,
    },
    include: {
      variants: true,
    },
    take: 4,
  })

  // Apply user's price multiplier to all product prices
  const multiplier = user?.priceMultiplier ?? 1.0
  const adjustedProducts = applyPriceMultiplierToProducts(products, multiplier)

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold font-serif">Featured Products</h2>
            <p className="mt-2 text-muted-foreground">
              Explore our handpicked selection of premium flowers
            </p>
          </div>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            View all products →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {adjustedProducts.map((product) => (
            <ProductCard key={product.slug} product={product} user={user} />
          ))}
        </div>
      </div>
    </div>
  )
}
