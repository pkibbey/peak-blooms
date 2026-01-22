"use server"

import { getCurrentUser } from "@/lib/current-user"
import { getProducts } from "@/lib/data"
import type { SearchProductsResult } from "@/lib/query-types"
import { type SearchProductsInput, searchProductsSchema } from "@/lib/validations/search"
import { wrapAction } from "@/server/error-handler"

/**
 * Server action for searching products with debouncing on client
 * Returns search results with user's price multiplier applied
 */
export const searchProducts = wrapAction(
  async (input: SearchProductsInput): Promise<SearchProductsResult> => {
    const { searchTerm } = searchProductsSchema.parse(input)
    const trimmedTerm = searchTerm.trim()

    // Return empty results if search term is whitespace-only
    if (!trimmedTerm) {
      return { products: [] }
    }

    const user = await getCurrentUser()
    const multiplier = user?.priceMultiplier ?? 1.0

    // Exclude incomplete products from search results
    const result = await getProducts(
      {
        search: trimmedTerm,
        limit: 10,
        filterDescription: "has",
        filterImages: "has",
      },
      multiplier
    )

    // Map to simpler response shape for client
    const products = result.products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || null,
      price: product.price,
    }))

    return { products }
  }
)
