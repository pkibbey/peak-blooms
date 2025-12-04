import { z } from "zod"

export const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().min(1, "Slug is required"),
  image: z.string(),
  description: z.string(),
  featured: z.boolean().default(false),
})

export type CollectionFormData = z.infer<typeof collectionSchema>
