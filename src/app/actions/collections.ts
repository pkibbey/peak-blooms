"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
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

export async function createCollectionAction(input: CreateCollectionInput) {
  try {
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
          create: (productIds || []).map((productId: string) => ({
            productId,
          })),
        },
      },
    })

    revalidatePath("/admin/collections")
    return { success: true, id: collection.id }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid collection data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create collection")
  }
}

export async function updateCollectionAction(input: UpdateCollectionInput) {
  try {
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
        productCollections:
          productIds !== undefined
            ? {
                deleteMany: {},
                create: productIds.map((productId: string) => ({
                  productId,
                })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/collections")
    return { success: true, id: collection.id }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid collection data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update collection")
  }
}

export async function deleteCollectionAction(input: DeleteCollectionInput) {
  try {
    const { id } = deleteCollectionSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await db.collection.delete({
      where: { id },
    })

    revalidatePath("/admin/collections")
    return { success: true }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid collection data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete collection")
  }
}

export async function toggleCollectionFeaturedAction(input: ToggleCollectionFeaturedInput) {
  try {
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
    return { success: true, featured: collection.featured }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid collection data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update collection")
  }
}
