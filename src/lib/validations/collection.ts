import { z } from "zod"
import type { CollectionUncheckedCreateInput } from "@/generated/models"

export const collectionSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  slug: z.string().min(1, "Slug is required"),
  image: z.string(),
  description: z.string(),
  featured: z.boolean(),
})

export type CollectionFormData = z.infer<typeof collectionSchema>
// Collection operation schemas for API requests
export const createCollectionSchema = collectionSchema.extend({
  productIds: z.array(z.string().uuid()).optional().default([]),
})

export type CreateCollectionInput = Omit<
  CollectionUncheckedCreateInput,
  "productCollections" | "createdAt" | "updatedAt"
> & { productIds?: string[] }

export const updateCollectionSchema = createCollectionSchema.extend({
  id: z.string().uuid("Invalid collection ID"),
})

export type UpdateCollectionInput = Omit<
  CollectionUncheckedCreateInput,
  "productCollections" | "createdAt" | "updatedAt"
> & { id: string; productIds?: string[] }

export const deleteCollectionSchema = z.object({
  id: z.string().uuid("Invalid collection ID"),
})

export type DeleteCollectionInput = z.infer<typeof deleteCollectionSchema>

export const toggleCollectionFeaturedSchema = z.object({
  id: z.string().uuid("Invalid collection ID"),
  featured: z.boolean(),
})

export type ToggleCollectionFeaturedInput = z.infer<typeof toggleCollectionFeaturedSchema>
