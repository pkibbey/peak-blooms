"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/site/ProductCard"
import ShopFilters from "@/components/site/ShopFilters"
import { useSession } from "next-auth/react"

export default function ShopPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories")
        const data = await response.json()
        setCategories(data)
      } catch (error) {
        console.error("Error fetching categories:", error)
      }
    }

    fetchCategories()
  }, [])

  // Fetch products with filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const queryString = searchParams.toString()
        const url = `/api/products${queryString ? `?${queryString}` : ""}`
        const response = await fetch(url)
        const data = await response.json()
        setProducts(data)
      } catch (error) {
        console.error("Error fetching products:", error)
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [searchParams])

  const user = session?.user
    ? {
        role: session.user.role as "CUSTOMER" | "ADMIN",
        approved: (session.user as any).approved || false,
        email: session.user.email,
        name: session.user.name,
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
        <ShopFilters categories={categories} user={user} />

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-muted-foreground">No products found matching your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} user={user} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
