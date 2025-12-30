"use server"

import { getCurrentUser } from "@/lib/current-user"
import { getProducts } from "@/lib/data"
import { type SearchProductsInput, searchProductsSchema } from "@/lib/validations/search"

interface SearchProductsResult {
  products: Array<{
    id: string
    name: string
    slug: string
    image: string | null
    price: number | null
  }>
}

/**
 * Server action for searching products with debouncing on client
 * Returns search results with user's price multiplier applied
 */
export async function searchProducts(input: SearchProductsInput): Promise<SearchProductsResult> {
  try {
    const { searchTerm } = searchProductsSchema.parse(input)

    // Return empty results if search term is whitespace-only
    if (!searchTerm.trim()) {
      return { products: [] }
    }

    const user = await getCurrentUser()
    const multiplier = user?.priceMultiplier ?? 1.0

    const result = await getProducts(
      {
        search: searchTerm,
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
  } catch {
    return { products: [] }
  }
}
