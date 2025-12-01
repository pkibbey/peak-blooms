import { z } from "zod"

const productSelectionSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productVariantId: z.string().min(1, "Variant is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
})

export type ProductSelection = z.infer<typeof productSelectionSchema>

export const inspirationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  subtitle: z.string().min(1, "Subtitle is required"),
  image: z.string().min(1, "Image is required"),
  excerpt: z.string().min(1, "Excerpt is required"),
  inspirationText: z.string().min(1, "Inspiration text is required"),
  productSelections: z.array(productSelectionSchema),
})

export type InspirationFormData = z.infer<typeof inspirationSchema>
