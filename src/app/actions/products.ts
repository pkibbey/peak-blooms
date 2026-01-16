"use server"

import { revalidatePath } from "next/cache"
import type { ProductWhereInput } from "@/generated/models"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { ProductBasic } from "@/lib/query-types"
import {
  type CreateProductFormData,
  createProductFormSchema,
  type DeleteProductInput,
  deleteProductSchema,
  type GetProductCountInput,
  getProductCountSchema,
  type ToggleProductFeaturedInput,
  toggleProductFeaturedSchema,
  type UpdateProductInput,
  updateProductSchema,
} from "@/lib/validations/product"

export async function createProductAction(data: CreateProductFormData): Promise<ProductBasic> {
  const validatedData = createProductFormSchema.parse(data)
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const product = await db.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        image: validatedData.image,
        price: parseFloat(validatedData.price),
        colors: validatedData.colors || [],
        productType: validatedData.productType,
        featured: validatedData.featured,
        productCollections: {
          create: (validatedData.collectionIds || []).map((collectionId) => ({
            collectionId,
          })),
        },
      },
    })

    revalidatePath("/admin/products")
    return product
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to create product")
  }
}

export async function updateProductAction(input: UpdateProductInput): Promise<ProductBasic> {
  const { id, ...data } = updateProductSchema.parse(input)
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
        price: data.price,
        colors: data.colors || [],
        productType: data.productType,
        featured: data.featured,
        productCollections:
          data.collectionIds !== null
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
    return product
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to update product")
  }
}

export async function deleteProductAction(
  input: DeleteProductInput
): Promise<{ success: boolean }> {
  const { id } = deleteProductSchema.parse(input)
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
    throw new Error(error instanceof Error ? error.message : "Failed to delete product")
  }
}

export async function toggleProductFeaturedAction(
  input: ToggleProductFeaturedInput
): Promise<{ success: boolean; featured: boolean }> {
  const { id, featured } = toggleProductFeaturedSchema.parse(input)
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
    throw new Error(error instanceof Error ? error.message : "Failed to update product")
  }
}

/**
 * Server action to get product count with optional filters
 * Used for pagination calculations
 */
export async function getProductCountAction(input?: GetProductCountInput): Promise<number> {
  const params = input ? getProductCountSchema.parse(input) : {}
  try {
    // Build the where clause dynamically
    const where: ProductWhereInput = { deletedAt: null }

    if (params?.boxlotOnly) {
      where.productType = "ROSE"
    }

    if (params?.query) {
      where.OR = [
        { name: { contains: params.query, mode: "insensitive" } },
        { description: { contains: params.query, mode: "insensitive" } },
      ]
    }

    const count = await db.product.count({ where })
    return count
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to get product count")
  }
}
