"use server"

import { revalidatePath } from "next/cache"
import type { ProductWhereInput } from "@/generated/models"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, ProductBasic } from "@/lib/query-types"
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

export async function createProductAction(
  data: CreateProductFormData
): Promise<AppResult<ProductBasic>> {
  try {
    const validatedData = createProductFormSchema.parse(data)

    const session = await getSession()

    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[createProductAction] Not authorized")
      return {
        success: false,
        error: "You must be an admin to create products",
        code: "UNAUTHORIZED",
      }
    }

    const product = await db.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        image: validatedData.image,
        price: validatedData.price ? parseFloat(validatedData.price) : null,
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
    return {
      success: true,
      data: product,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[createProductAction] Error:", errorMessage, error)
    return toAppError(error, "Failed to create product")
  }
}

export async function updateProductAction(
  input: UpdateProductInput
): Promise<AppResult<ProductBasic>> {
  try {
    const { id, ...data } = updateProductSchema.parse(input)
    const session = await getSession()

    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[updateProductAction] Not authorized")
      return {
        success: false,
        error: "You must be an admin to update products",
        code: "UNAUTHORIZED",
      }
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
    return {
      success: true,
      data: product,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[updateProductAction] Error:", errorMessage, error)
    return toAppError(error, "Failed to update product")
  }
}

export async function deleteProductAction(
  input: DeleteProductInput
): Promise<AppResult<{ id: string }>> {
  try {
    const { id } = deleteProductSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to delete products",
        code: "UNAUTHORIZED",
      }
    }

    await db.product.delete({
      where: { id },
    })

    revalidatePath("/admin/products")
    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    return toAppError(error, "Failed to delete product")
  }
}

export async function toggleProductFeaturedAction(
  input: ToggleProductFeaturedInput
): Promise<AppResult<{ id: string; featured: boolean }>> {
  try {
    const { id, featured } = toggleProductFeaturedSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to update products",
        code: "UNAUTHORIZED",
      }
    }

    const product = await db.product.update({
      where: { id },
      data: { featured },
    })

    revalidatePath("/admin/products")
    return {
      success: true,
      data: { id: product.id, featured: product.featured },
    }
  } catch (error) {
    return toAppError(error, "Failed to update product")
  }
}

/**
 * Server action to get product count with optional filters
 * Used for pagination calculations
 */
export async function getProductCountAction(
  input?: GetProductCountInput
): Promise<AppResult<number>> {
  try {
    const params = input ? getProductCountSchema.parse(input) : {}

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
    return {
      success: true,
      data: count,
    }
  } catch (error) {
    return toAppError(error, "Failed to get product count")
  }
}
