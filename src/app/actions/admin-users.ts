"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth, invalidateUserSessions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  type ApproveUserInput,
  approveUserSchema,
  type CreateUserInput,
  createUserSchema,
  type UnapproveUserInput,
  type UpdateUserPriceMultiplierInput,
  unapproveUserSchema,
  updateUserPriceMultiplierSchema,
} from "@/lib/validations/auth"

type AdminUserResponse = {
  id: string
  email: string
  name: string | null
  role: string
  approved: boolean
  priceMultiplier: number
  createdAt: Date
}

/**
 * Approve a user (admin only)
 */
export async function approveUserAction(input: ApproveUserInput): Promise<AdminUserResponse> {
  try {
    const { userId } = approveUserSchema.parse(input)

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
    throw new Error(error instanceof Error ? error.message : "Failed to approve user")
  }
}

/**
 * Unapprove/revoke a user (admin only)
 */
export async function unapproveUserAction(input: UnapproveUserInput): Promise<AdminUserResponse> {
  try {
    const { userId } = unapproveUserSchema.parse(input)

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
    throw new Error(error instanceof Error ? error.message : "Failed to unapprove user")
  }
}

/**
 * Update user's price multiplier (admin only)
 */
export async function updateUserPriceMultiplierAction(
  input: UpdateUserPriceMultiplierInput
): Promise<AdminUserResponse> {
  try {
    const { userId, multiplier } = updateUserPriceMultiplierSchema.parse(input)

    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      throw new Error("Unauthorized")
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
    throw new Error(error instanceof Error ? error.message : "Failed to update price multiplier")
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUserAction(input: CreateUserInput): Promise<AdminUserResponse> {
  try {
    const data = createUserSchema.parse(input)

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
    throw new Error(error instanceof Error ? error.message : "Failed to create user")
  }
}
