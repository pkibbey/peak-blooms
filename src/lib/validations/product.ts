import { z } from "zod"

const productVariantSchema = z.object({
  id: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0, {
      message: "Price must be a valid positive number",
    }),
  stemLength: z.string(),
  quantityPerBunch: z.string(),
  isBoxlot: z.boolean(),
})

export type ProductVariantFormData = z.infer<typeof productVariantSchema>

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  image: z.string(),
  // Colors array: zero or more color IDs (e.g. ["pink", "rose", "greenery"]). Use empty array instead of single string.
  // Color IDs reference the COLORS object in lib/colors.ts
  colors: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).min(1, "At least one collection is required"),
  productType: z.enum(["FLOWER", "FILLER"]),
  featured: z.boolean(),
  variants: z
    .array(productVariantSchema)
    .min(1, "At least one variant is required")
    .refine((variants) => variants.some((v) => v.price.trim() !== ""), {
      message: "At least one variant with a price is required",
    }),
})

export type ProductFormData = z.infer<typeof productSchema>

// Schema for API request (parsed values)
export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable(),
  image: z.string().nullable(),
  // API input: allow null or an array of valid color IDs (reference lib/colors.ts COLORS object)
  colors: z.array(z.string()).nullable(),
  collectionIds: z.array(z.string()).min(1, "At least one collection is required"),
  productType: z.enum(["FLOWER", "FILLER"]).default("FLOWER"),
  featured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        price: z.number().min(0, "Price must be a positive number"),
        stemLength: z.number().nullable(),
        quantityPerBunch: z.number().nullable(),
        isBoxlot: z.boolean().default(false),
      })
    )
    .min(1, "At least one variant is required"),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
