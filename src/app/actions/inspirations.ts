"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, InspirationForResponse } from "@/lib/query-types"
import {
  type CreateInspirationInput,
  createInspirationSchema,
  type DeleteInspirationInput,
  deleteInspirationSchema,
  type UpdateInspirationInput,
  updateInspirationSchema,
} from "@/lib/validations/inspiration"

export async function createInspirationAction(
  input: CreateInspirationInput
): Promise<AppResult<InspirationForResponse>> {
  try {
    const data = createInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to create inspirations",
        code: "UNAUTHORIZED",
      }
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
    return {
      success: true,
      data: inspiration,
    }
  } catch (error) {
    return toAppError(error, "Failed to create inspiration")
  }
}

export async function updateInspirationAction(
  input: UpdateInspirationInput
): Promise<AppResult<InspirationForResponse>> {
  try {
    const { id, ...data } = updateInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to update inspirations",
        code: "UNAUTHORIZED",
      }
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
    return {
      success: true,
      data: inspiration,
    }
  } catch (error) {
    return toAppError(error, "Failed to update inspiration")
  }
}

export async function deleteInspirationAction(
  input: DeleteInspirationInput
): Promise<AppResult<{ id: string }>> {
  try {
    const { id } = deleteInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to delete inspirations",
        code: "UNAUTHORIZED",
      }
    }

    await db.inspiration.delete({
      where: { id },
    })

    revalidatePath("/admin/inspirations")
    return {
      success: true,
      data: { id },
    }
  } catch (error) {
    return toAppError(error, "Failed to delete inspiration")
  }
}
