"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { auth, invalidateUserSessions } from "@/lib/auth"
import { db } from "@/lib/db"
import type { AdminUserResponse } from "@/lib/query-types"
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
import { wrapAction } from "@/server/error-handler"

/**
 * Approve a user (admin only)
 */
export const approveUserAction = wrapAction(
  async (input: ApproveUserInput): Promise<AdminUserResponse> => {
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
  }
)

/**
 * Unapprove/revoke a user (admin only)
 */
export const unapproveUserAction = wrapAction(
  async (input: UnapproveUserInput): Promise<AdminUserResponse> => {
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
  }
)

/**
 * Update user's price multiplier (admin only)
 */
export const updateUserPriceMultiplierAction = wrapAction(
  async (input: UpdateUserPriceMultiplierInput): Promise<AdminUserResponse> => {
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
  }
)

/**
 * Create a new user (admin only)
 */
export const createUserAction = wrapAction(
  async (input: CreateUserInput): Promise<AdminUserResponse> => {
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
  }
)
