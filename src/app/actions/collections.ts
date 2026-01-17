"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, CollectionBasic } from "@/lib/query-types"
import {
  type CreateCollectionInput,
  createCollectionSchema,
  type DeleteCollectionInput,
  deleteCollectionSchema,
  type ToggleCollectionFeaturedInput,
  toggleCollectionFeaturedSchema,
  type UpdateCollectionInput,
  updateCollectionSchema,
} from "@/lib/validations/collection"

export async function createCollectionAction(
  input: CreateCollectionInput
): Promise<
  AppResult<
    Pick<
      CollectionBasic,
      "id" | "name" | "slug" | "image" | "description" | "featured" | "createdAt" | "updatedAt"
    >
  >
> {
  const { productIds, ...data } = createCollectionSchema.parse(input)
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
  }

  try {
    const collection = await db.collection.create({
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image,
        description: data.description,
        featured: data.featured,
        productCollections: {
          create: productIds.map((productId: string) => ({
            productId,
          })),
        },
      },
    })

    revalidatePath("/admin/collections")
    return { success: true, data: collection }
  } catch (error) {
    return toAppError(error, "Failed to create collection")
  }
}

export async function updateCollectionAction(
  input: UpdateCollectionInput
): Promise<
  AppResult<
    Pick<
      CollectionBasic,
      "id" | "name" | "slug" | "image" | "description" | "featured" | "createdAt" | "updatedAt"
    >
  >
> {
  const { id, productIds, ...data } = updateCollectionSchema.parse(input)
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
  }

  try {
    const collection = await db.collection.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        image: data.image,
        description: data.description,
        featured: data.featured,
        productCollections: {
          deleteMany: {},
          create: productIds.map((productId: string) => ({
            productId,
          })),
        },
      },
    })

    revalidatePath("/admin/collections")
    return { success: true, data: collection }
  } catch (error) {
    return toAppError(error, "Failed to update collection")
  }
}

export async function deleteCollectionAction(
  input: DeleteCollectionInput
): Promise<AppResult<{ id: string }>> {
  const { id } = deleteCollectionSchema.parse(input)
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
  }

  try {
    await db.collection.delete({
      where: { id },
    })

    revalidatePath("/admin/collections")
    return { success: true, data: { id } }
  } catch (error) {
    return toAppError(error, "Failed to delete collection")
  }
}

export async function toggleCollectionFeaturedAction(
  input: ToggleCollectionFeaturedInput
): Promise<AppResult<{ id: string; featured: boolean }>> {
  const { id, featured } = toggleCollectionFeaturedSchema.parse(input)
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
  }

  try {
    const collection = await db.collection.update({
      where: { id },
      data: { featured },
    })

    revalidatePath("/admin/collections")
    return { success: true, data: { id, featured: collection.featured } }
  } catch (error) {
    return toAppError(error, "Failed to update collection")
  }
}
