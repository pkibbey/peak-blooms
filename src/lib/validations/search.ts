import { z } from "zod"

// Search products schema
export const searchProductsSchema = z.object({
  searchTerm: z
    .string()
    .min(1, "Search term is required")
    .max(100, "Search term must be 100 characters or less"),
})

export type SearchProductsInput = z.infer<typeof searchProductsSchema>
