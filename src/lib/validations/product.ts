import { z } from "zod"

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  image: z.string(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0, {
      message: "Price must be a valid positive number",
    }),
  // Colors array: zero or more color IDs (e.g. ["pink", "rose", "greenery"]). Use empty array instead of single string.
  // Color IDs reference the COLORS object in lib/colors.ts
  colors: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).min(1, "At least one collection is required"),
  productType: z.enum(["FLOWER", "FILLER", "ROSE"]),
  featured: z.boolean(),
})

export type ProductFormData = z.infer<typeof productSchema>

// Schema for API request (parsed values)
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable(),
  image: z.string().nullable(),
  price: z.number().min(0, "Price must be a positive number"),
  // API input: allow null or an array of valid color IDs (reference lib/colors.ts COLORS object)
  colors: z.array(z.string()).nullable(),
  collectionIds: z.array(z.string()).min(1, "At least one collection is required"),
  productType: z.enum(["FLOWER", "FILLER", "ROSE"]).default("FLOWER"),
  featured: z.boolean().default(false),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
