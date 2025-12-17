"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { ProductFormData } from "@/lib/validations/product"

export async function createProductAction(data: ProductFormData & { collectionIds?: string[] }) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const product = await db.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        price: parseFloat(data.price),
        colors: data.colors,
        productType: data.productType,
        featured: data.featured,
        productCollections: {
          create: (data.collectionIds || []).map((collectionId) => ({
            collectionId,
          })),
        },
      },
    })

    revalidatePath("/admin/products")
    return { success: true, id: product.id }
  } catch (error) {
    console.error("createProductAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create product")
  }
}

export async function updateProductAction(
  id: string,
  data: ProductFormData & { collectionIds?: string[] }
) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        image: data.image,
        price: parseFloat(data.price),
        colors: data.colors,
        productType: data.productType,
        featured: data.featured,
        productCollections:
          data.collectionIds !== undefined
            ? {
                deleteMany: {},
                create: data.collectionIds.map((collectionId) => ({
                  collectionId,
                })),
              }
            : undefined,
      },
    })

    revalidatePath("/admin/products")
    return { success: true, id: product.id }
  } catch (error) {
    console.error("updateProductAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update product")
  }
}

export async function deleteProductAction(id: string) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await db.product.delete({
      where: { id },
    })

    revalidatePath("/admin/products")
    return { success: true }
  } catch (error) {
    console.error("deleteProductAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to delete product")
  }
}

export async function toggleProductFeaturedAction(id: string, featured: boolean) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const product = await db.product.update({
      where: { id },
      data: { featured },
    })

    revalidatePath("/admin/products")
    return { success: true, featured: product.featured }
  } catch (error) {
    console.error("toggleProductFeaturedAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update product")
  }
}

/**
 * Server action to get product count with optional filters
 * Used for pagination calculations
 */
export async function getProductCountAction(params?: {
  boxlotOnly?: boolean
  query?: string
}): Promise<number> {
  try {
    // Build the where clause dynamically
    const where: { deletedAt: null; productType?: string; OR?: Array<any> } = { deletedAt: null }

    if (params?.boxlotOnly) {
      where.productType = "BOXLOT"
    }

    if (params?.query) {
      where.OR = [
        { name: { contains: params.query, mode: "insensitive" } },
        { description: { contains: params.query, mode: "insensitive" } },
      ]
    }

    const count = await db.product.count({ where: where as any })
    return count
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to get product count")
  }
}
