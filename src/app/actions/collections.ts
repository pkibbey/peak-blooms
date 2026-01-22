"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { CollectionBasic } from "@/lib/query-types"
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
import { wrapAction } from "@/server/error-handler"

export const createCollectionAction = wrapAction(
  async (
    input: CreateCollectionInput
  ): Promise<
    Pick<
      CollectionBasic,
      "id" | "name" | "slug" | "image" | "description" | "featured" | "createdAt" | "updatedAt"
    >
  > => {
    const { productIds, ...data } = createCollectionSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

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
    return collection
  }
)

export const updateCollectionAction = wrapAction(
  async (
    input: UpdateCollectionInput
  ): Promise<
    Pick<
      CollectionBasic,
      "id" | "name" | "slug" | "image" | "description" | "featured" | "createdAt" | "updatedAt"
    >
  > => {
    const { id, productIds, ...data } = updateCollectionSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

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
    return collection
  }
)

export const deleteCollectionAction = wrapAction(
  async (input: DeleteCollectionInput): Promise<{ id: string }> => {
    const { id } = deleteCollectionSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await db.collection.delete({
      where: { id },
    })

    revalidatePath("/admin/collections")
    return { id }
  }
)

export const toggleCollectionFeaturedAction = wrapAction(
  async (input: ToggleCollectionFeaturedInput): Promise<{ id: string; featured: boolean }> => {
    const { id, featured } = toggleCollectionFeaturedSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const collection = await db.collection.update({
      where: { id },
      data: { featured },
    })

    revalidatePath("/admin/collections")
    return { id, featured: collection.featured }
  }
)
