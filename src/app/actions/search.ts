"use server"

import { getCurrentUser } from "@/lib/current-user"
import { getProducts } from "@/lib/data"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, SearchProductsResult } from "@/lib/query-types"
import { type SearchProductsInput, searchProductsSchema } from "@/lib/validations/search"

/**
 * Server action for searching products with debouncing on client
 * Returns search results with user's price multiplier applied
 */
export async function searchProducts(
  input: SearchProductsInput
): Promise<AppResult<SearchProductsResult>> {
  try {
    const { searchTerm } = searchProductsSchema.parse(input)
    const trimmedTerm = searchTerm.trim()

    // Return empty results if search term is whitespace-only
    if (!trimmedTerm) {
      return { success: true, data: { products: [] } }
    }

    const user = await getCurrentUser()
    const multiplier = user?.priceMultiplier ?? 1.0

    const result = await getProducts(
      {
        search: trimmedTerm,
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

    return {
      success: true,
      data: { products },
    }
  } catch (error) {
    return toAppError(error, "Failed to search products")
  }
}
