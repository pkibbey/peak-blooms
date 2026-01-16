"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
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
): Promise<{ success: boolean; id: string }> {
  try {
    const data = createInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
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
    return { success: true, id: inspiration.id }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid inspiration data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create inspiration")
  }
}

export async function updateInspirationAction(
  input: UpdateInspirationInput
): Promise<{ success: boolean; id: string }> {
  try {
    const { id, ...data } = updateInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
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
    return { success: true, id: inspiration.id }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid inspiration data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update inspiration")
  }
}

export async function deleteInspirationAction(
  input: DeleteInspirationInput
): Promise<{ success: boolean }> {
  try {
    const { id } = deleteInspirationSchema.parse(input)
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    await db.inspiration.delete({
      where: { id },
    })

    revalidatePath("/admin/inspirations")
    return { success: true }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid inspiration data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to delete inspiration")
  }
}
