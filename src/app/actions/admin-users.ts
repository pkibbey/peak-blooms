"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth, invalidateUserSessions } from "@/lib/auth"
import { db } from "@/lib/db"
import { isValidPriceMultiplier } from "@/lib/utils"

/**
 * Approve a user (admin only)
 */
export async function approveUserAction(userId: string) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { approved: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        priceMultiplier: true,
        createdAt: true,
      },
    })

    // Only invalidate if not current user
    if (session.user.id !== userId) {
      await invalidateUserSessions(userId)
    }

    revalidatePath("/admin/users")
    return user
  } catch (error) {
    console.error("approveUserAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to approve user")
  }
}

/**
 * Unapprove/revoke a user (admin only)
 */
export async function unapproveUserAction(userId: string) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { approved: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        priceMultiplier: true,
        createdAt: true,
      },
    })

    // Only invalidate if not current user
    if (session.user.id !== userId) {
      await invalidateUserSessions(userId)
    }

    revalidatePath("/admin/users")
    return user
  } catch (error) {
    console.error("unapproveUserAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to unapprove user")
  }
}

/**
 * Update user's price multiplier (admin only)
 */
export async function updateUserPriceMultiplierAction(userId: string, multiplier: number) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    if (!isValidPriceMultiplier(multiplier)) {
      throw new Error("Price multiplier must be between 0.5 and 2.0")
    }

    const user = await db.user.update({
      where: { id: userId },
      data: { priceMultiplier: multiplier },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        priceMultiplier: true,
        createdAt: true,
      },
    })

    // Only invalidate if not current user
    if (session.user.id !== userId) {
      await invalidateUserSessions(userId)
    }

    revalidatePath("/admin/users")
    return user
  } catch (error) {
    console.error("updateUserPriceMultiplierAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update price multiplier")
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUserAction(data: {
  email: string
  name: string
  phone: string
  role: "CUSTOMER" | "ADMIN" | "SUBSCRIBER"
  priceMultiplier: number
  approved: boolean
}) {
  try {
    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error("Email already exists")
    }

    if (!isValidPriceMultiplier(data.priceMultiplier)) {
      throw new Error("Price multiplier must be between 0.5 and 2.0")
    }

    const user = await db.user.create({
      data: {
        email: data.email,
        name: data.name,
        role: data.role,
        approved: data.approved,
        priceMultiplier: data.priceMultiplier,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        approved: true,
        priceMultiplier: true,
        createdAt: true,
      },
    })

    revalidatePath("/admin/users")
    return user
  } catch (error) {
    console.error("createUserAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create user")
  }
}
