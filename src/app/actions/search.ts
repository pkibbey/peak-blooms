"use server"

import { getCurrentUser } from "@/lib/current-user"
import { getProducts } from "@/lib/data"

export interface SearchProductsResult {
  products: Array<{
    id: string
    name: string
    slug: string
    image: string | null
    price: number
  }>
}

/**
 * Server action for searching products with debouncing on client
 * Returns search results with user's price multiplier applied
 */
export async function searchProducts(searchTerm: string): Promise<SearchProductsResult> {
  try {
    if (!searchTerm.trim()) {
      return { products: [] }
    }

    const user = await getCurrentUser()
    const multiplier = user?.priceMultiplier ?? 1.0

    const result = await getProducts(
      {
        search: searchTerm.trim(),
        limit: 10,
      },
      multiplier
    )

    // Map to simpler response shape for client
    const products = result.products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      price: product.price,
    }))

    return { products }
  } catch (error) {
    console.error("searchProducts error:", error)
    return { products: [] }
  }
}
