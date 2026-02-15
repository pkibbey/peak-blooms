"use server"

import { randomUUID } from "node:crypto"
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
import { wrapAction } from "@/server/error-handler"

export const createProductAction = wrapAction(
  async (data: CreateProductFormData): Promise<ProductBasic> => {
    const validatedData = createProductFormSchema.parse(data)

    const session = await getSession()

    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to create products")
    }

    const product = await db.product.create({
      data: {
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        images: validatedData.images,
        price: validatedData.price ? parseFloat(validatedData.price) : 0,
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
  }
)

export const updateProductAction = wrapAction(
  async (input: UpdateProductInput): Promise<ProductBasic> => {
    const { id, ...data } = updateProductSchema.parse(input)
    const session = await getSession()

    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to update products")
    }

    // Read existing price so we only create history when the numeric price actually changes
    const existingProduct = await db.product.findUnique({ where: { id }, select: { price: true } })

    if (existingProduct && existingProduct.price !== data.price) {
      // Update product AND create a history entry in a single transaction
      const historyId = randomUUID()
      const [updatedProduct] = await db.$transaction([
        db.product.update({
          where: { id },
          data: {
            name: data.name,
            slug: data.slug,
            description: data.description,
            images: data.images,
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
        }),
        // Insert history row using a raw SQL statement (avoids referencing the generated client until you run migrations)
        db.$executeRaw`
          INSERT INTO "ProductPriceHistory" ("id","productId","previousPrice","newPrice","changedByUserId")
          VALUES (${historyId}, ${id}, ${existingProduct.price}, ${data.price}, ${session.user.id})
        `,
      ])

      revalidatePath("/admin/products")
      return updatedProduct
    }

    const product = await db.product.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        images: data.images,
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
  }
)

export const deleteProductAction = wrapAction(
  async (input: DeleteProductInput): Promise<{ id: string }> => {
    const { id } = deleteProductSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to delete products")
    }

    await db.product.delete({
      where: { id },
    })

    revalidatePath("/admin/products")
    return { id }
  }
)

export const toggleProductFeaturedAction = wrapAction(
  async (input: ToggleProductFeaturedInput): Promise<{ id: string; featured: boolean }> => {
    const { id, featured } = toggleProductFeaturedSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to update products")
    }

    const product = await db.product.update({
      where: { id },
      data: { featured },
    })

    revalidatePath("/admin/products")
    return { id: product.id, featured: product.featured }
  }
)

/**
 * Server action to get product count with optional filters
 * Used for pagination calculations
 */
export const getProductCountAction = wrapAction(
  async (input?: GetProductCountInput): Promise<number> => {
    const params = input ? getProductCountSchema.parse(input) : {}

    // Build the where clause dynamically
    const where: ProductWhereInput = { deletedAt: null }

    // Support filtering by collection slug(s) via `collection` param (e.g. collection=roses)
    if (params?.collection) {
      const slugs = Array.isArray(params.collection)
        ? params.collection
        : params.collection.split(",")
      const collections = await db.collection.findMany({
        where: { slug: { in: slugs } },
        select: { id: true },
      })
      const collectionIds = collections.map((c) => c.id)
      if (collectionIds.length > 0) {
        where.productCollections = { some: { collectionId: { in: collectionIds } } }
      }
    }

    if (params?.query) {
      where.OR = [
        { name: { contains: params.query, mode: "insensitive" } },
        { description: { contains: params.query, mode: "insensitive" } },
      ]
    }

    const count = await db.product.count({ where })
    return count
  }
)
