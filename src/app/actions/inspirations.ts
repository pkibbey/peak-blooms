"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { InspirationForResponse } from "@/lib/query-types"
import {
  type CreateInspirationInput,
  createInspirationSchema,
  type DeleteInspirationInput,
  deleteInspirationSchema,
  type UpdateInspirationInput,
  updateInspirationSchema,
} from "@/lib/validations/inspiration"
import { wrapAction } from "@/server/error-handler"

export const createInspirationAction = wrapAction(
  async (input: CreateInspirationInput): Promise<InspirationForResponse> => {
    const data = createInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to create inspirations")
    }

    const inspiration = await db.inspiration.create({
      data: {
        name: data.name,
        slug: data.slug,
        subtitle: data.subtitle,
        image: data.image,
        excerpt: data.excerpt,
        text: data.text,
        products: {
          create: data.productSelections.map((ps) => ({
            productId: ps.productId,
            quantity: ps.quantity,
          })),
        },
      },
    })

    revalidatePath("/admin/inspirations")
    return inspiration
  }
)

export const updateInspirationAction = wrapAction(
  async (input: UpdateInspirationInput): Promise<InspirationForResponse> => {
    const { id, ...data } = updateInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to update inspirations")
    }

    const inspiration = await db.inspiration.update({
      where: { id },
      data: {
        name: data.name,
        slug: data.slug,
        subtitle: data.subtitle,
        image: data.image,
        excerpt: data.excerpt,
        text: data.text,
        products: {
          deleteMany: {},
          create: data.productSelections.map((ps) => ({
            productId: ps.productId,
            quantity: ps.quantity,
          })),
        },
      },
    })

    revalidatePath("/admin/inspirations")
    return inspiration
  }
)

export const deleteInspirationAction = wrapAction(
  async (input: DeleteInspirationInput): Promise<{ id: string }> => {
    const { id } = deleteInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to delete inspirations")
    }

    await db.inspiration.delete({
      where: { id },
    })

    revalidatePath("/admin/inspirations")
    return { id }
  }
)
