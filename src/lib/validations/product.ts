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
  countPerBunch: z.string(),
  isBoxlot: z.boolean(),
})

export type ProductVariantFormData = z.infer<typeof productVariantSchema>

const HEX_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  image: z.string(),
  // Colors array: zero or more hex values (e.g. ["#FF6B6B", "#FFFFFF"]). Use empty array instead of single string.
  colors: z
    .array(
      z.string().refine((val) => HEX_REGEX.test(val), { message: "Each color must be a valid hex" })
    )
    .optional(),
  collectionId: z.string().min(1, "Collection is required"),
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
  // API input: allow null or an array of valid hex colors (use `colors` field).
  colors: z
    .array(
      z.string().refine((val) => HEX_REGEX.test(val), { message: "Each color must be a valid hex" })
    )
    .nullable(),
  collectionId: z.string().min(1, "Collection is required"),
  productType: z.enum(["FLOWER", "FILLER"]).default("FLOWER"),
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
