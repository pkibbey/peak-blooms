import { z } from "zod"
import { ProductType } from "@/generated/enums"
import type { ProductUncheckedCreateInput } from "@/generated/models"

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string(),
  images: z.array(z.string()), // Array of image URLs, ordered by display preference
  price: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0),
      {
        message: "Price must be a valid number 0 or greater",
      }
    ),
  colors: z.array(z.string()).nullable().optional(),
  collectionIds: z.array(z.string()).nullable().optional(),
  productType: z.enum(ProductType),
  featured: z.boolean(),
})

export type ProductFormData = z.infer<typeof productSchema>

// Schema for API request (parsed values)
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable(),
  images: z.array(z.string()).default([]), // Array of image URLs
  price: z.number().min(0, "Price must be a non-negative number"),
  colors: z.array(z.string()).nullable(),
  collectionIds: z.array(z.string()).nullable(),
  productType: z.enum(ProductType).default(ProductType.FLOWER),
  featured: z.boolean().default(false),
})

export type CreateProductInput = Omit<
  ProductUncheckedCreateInput,
  | "inspirations"
  | "orderItems"
  | "productCollections"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "colors"
> & { colors?: string[] | null }

// Product operation schemas for API requests
export const updateProductSchema = createProductSchema.extend({
  id: z.string().min(1, "Invalid product ID"),
})

export type UpdateProductInput = Omit<
  ProductUncheckedCreateInput,
  | "inspirations"
  | "orderItems"
  | "productCollections"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "colors"
> & { id: string; colors?: string[] | null }

export const deleteProductSchema = z.object({
  id: z.string().min(1, "Invalid product ID"),
})

export type DeleteProductInput = z.infer<typeof deleteProductSchema>

export const toggleProductFeaturedSchema = z.object({
  id: z.string().min(1, "Invalid product ID"),
  featured: z.boolean(),
})

export type ToggleProductFeaturedInput = z.infer<typeof toggleProductFeaturedSchema>

export const getProductCountSchema = z.object({
  boxlotOnly: z.boolean().optional(),
  query: z.string().max(255).optional(),
})

export type GetProductCountInput = z.infer<typeof getProductCountSchema>

// Schema for creating a product from form data (with string price)
export const createProductFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().nullable(),
  images: z.array(z.string()).default([]), // Array of image URLs
  price: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) >= 0),
      {
        message: "Price must be a valid number 0 or greater",
      }
    ),
  colors: z.array(z.string()).nullable(),
  collectionIds: z.array(z.string()).nullable(),
  productType: z.enum(ProductType).default(ProductType.FLOWER),
  featured: z.boolean().default(false),
})

export type CreateProductFormData = z.infer<typeof createProductFormSchema>
