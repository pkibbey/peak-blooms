import { z } from "zod"
import type { InspirationUncheckedCreateInput } from "@/generated/models"

const productSelectionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
})

export type ProductSelection = z.infer<typeof productSelectionSchema>

export const inspirationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  image: z.string().min(1, "Image is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  text: z.string().min(1, "Inspiration text is required"),
  productSelections: z.array(productSelectionSchema),
})

export type InspirationFormData = z.infer<typeof inspirationSchema>
// Inspiration operation schemas for API requests
export const createInspirationSchema = inspirationSchema

export type CreateInspirationInput = Omit<
  InspirationUncheckedCreateInput,
  "products" | "createdAt" | "updatedAt"
> & { productSelections: ProductSelection[] }

export const updateInspirationSchema = inspirationSchema.extend({
  id: z.string().uuid("Invalid inspiration ID"),
})

export type UpdateInspirationInput = Omit<
  InspirationUncheckedCreateInput,
  "products" | "createdAt" | "updatedAt"
> & { id: string; productSelections: ProductSelection[] }

export const deleteInspirationSchema = z.object({
  id: z.string().uuid("Invalid inspiration ID"),
})

export type DeleteInspirationInput = z.infer<typeof deleteInspirationSchema>
