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
  type DeleteUserInput,
  deleteUserSchema,
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

/**
 * Delete a user (admin only).
 * - Prevents deleting the currently authenticated admin user.
 * - Cascades will remove related records (sessions, addresses, orders) per Prisma schema.
 */
export const deleteUserAction = wrapAction(
  async (input: DeleteUserInput): Promise<AdminUserResponse> => {
    const { userId } = deleteUserSchema.parse(input)

    const headersList = await headers()
    const session = await auth.api.getSession({
      headers: headersList,
    })

    if (!session || (session.user.role as string) !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    // Prevent admins from deleting themselves via the UI/action
    if (session.user.id === userId) {
      throw new Error("Cannot delete yourself")
    }

    // Prevent deleting users who have invoices attached to any of their orders.
    // This mirrors the protection used in `deleteOrderAction` and prevents orphaned blobs/audit gaps.
    const orderWithInvoice = await db.order.findFirst({
      where: { userId, attachments: { some: { mime: "application/pdf" } } },
      select: { id: true },
    })

    if (orderWithInvoice) {
      throw new Error(
        "Conflict: User has orders with invoices attached — delete invoices before deleting the user"
      )
    }

    const user = await db.user.delete({
      where: { id: userId },
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

    // Ensure any remaining sessions are invalidated (cleanup)
    await invalidateUserSessions(userId)

    revalidatePath("/admin/users")
    return user
  }
)
