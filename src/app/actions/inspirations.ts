"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import type { InspirationFormData } from "@/lib/validations/inspiration"

export async function createInspirationAction(
  data: InspirationFormData & {
    productSelections: Array<{ productId: string; quantity: number }>
  }
) {
  try {
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
    throw new Error(error instanceof Error ? error.message : "Failed to create inspiration")
  }
}

export async function updateInspirationAction(
  id: string,
  data: InspirationFormData & {
    productSelections: Array<{ productId: string; quantity: number }>
  }
) {
  try {
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
    throw new Error(error instanceof Error ? error.message : "Failed to update inspiration")
  }
}

export async function deleteInspirationAction(id: string) {
  try {
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
    throw new Error(error instanceof Error ? error.message : "Failed to delete inspiration")
  }
}
