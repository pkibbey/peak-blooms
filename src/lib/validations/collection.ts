import { z } from "zod"

export const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().min(1, "Slug is required"),
  image: z.string(),
  description: z.string(),
})

export type CollectionFormData = z.infer<typeof collectionSchema>

// Schema for API request
export const createCollectionSchema = collectionSchema

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>
