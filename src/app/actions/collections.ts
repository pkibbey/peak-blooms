"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { CollectionFormData } from "@/lib/validations/collection"

export async function createCollectionAction(data: CollectionFormData & { productIds?: string[] }) {
  try {
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
          create: (data.productIds || []).map((productId) => ({
            productId,
          })),
        },
      },
    })

    revalidatePath("/admin/collections")
    return { success: true, id: collection.id }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to create collection")
  }
}

export async function updateCollectionAction(
  id: string,
  data: CollectionFormData & { productIds?: string[] }
) {
  try {
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
          data.productIds !== undefined
            ? {
                deleteMany: {},
                create: data.productIds.map((productId) => ({
                  productId,
                })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/collections")
    return { success: true, id: collection.id }
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to update collection")
  }
}

export async function deleteCollectionAction(id: string) {
  try {
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
    throw new Error(error instanceof Error ? error.message : "Failed to delete collection")
  }
}

export async function toggleCollectionFeaturedAction(id: string, featured: boolean) {
  try {
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
    throw new Error(error instanceof Error ? error.message : "Failed to update collection")
  }
}
