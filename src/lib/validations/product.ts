import { z } from "zod"

export const productVariantSchema = z.object({
  id: z.string().optional(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0, {
      message: "Price must be a valid positive number",
    }),
  stemLength: z.string(),
  countPerBunch: z.string(),
  isBoxlot: z.boolean(),
})

export type ProductVariantFormData = z.infer<typeof productVariantSchema>

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  image: z.string(),
  color: z.string(),
  collectionId: z.string().min(1, "Collection is required"),
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
  color: z.string().nullable(),
  collectionId: z.string().min(1, "Collection is required"),
  featured: z.boolean().default(false),
  variants: z
    .array(
      z.object({
        price: z.number().min(0, "Price must be a positive number"),
        stemLength: z.number().nullable(),
        countPerBunch: z.number().nullable(),
        isBoxlot: z.boolean().default(false),
      })
    )
    .min(1, "At least one variant is required"),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
