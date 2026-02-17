import { z } from "zod"
import { Role } from "@/generated/enums"

// Profile schema - email is read-only (from Google), only name can be updated
export const profileSchema = z.object({
  name: z.string(),
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Admin user role enum
const userRoleEnum = z.enum(Role)

// Approve user schema
export const approveUserSchema = z.object({
  userId: z.string().min(1, "Invalid user ID"),
})

export type ApproveUserInput = z.infer<typeof approveUserSchema>

// Unapprove user schema
export const unapproveUserSchema = z.object({
  userId: z.string().min(1, "Invalid user ID"),
})

export type UnapproveUserInput = z.infer<typeof unapproveUserSchema>

// Update user price multiplier schema
export const updateUserPriceMultiplierSchema = z.object({
  userId: z.string().min(1, "Invalid user ID"),
  multiplier: z
    .number()
    .min(0.5, "Price multiplier must be at least 0.5")
    .max(2.0, "Price multiplier cannot exceed 2.0"),
})

export type UpdateUserPriceMultiplierInput = z.infer<typeof updateUserPriceMultiplierSchema>

// Create user schema
export const createUserSchema = z.object({
  email: z.string().email("Must be a valid email address"),
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required"),
  role: userRoleEnum,
  priceMultiplier: z
    .number()
    .min(0.5, "Price multiplier must be at least 0.5")
    .max(2.0, "Price multiplier cannot exceed 2.0"),
  approved: z.boolean(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// Delete user schema
export const deleteUserSchema = z.object({
  userId: z.string().min(1, "Invalid user ID"),
})

export type DeleteUserInput = z.infer<typeof deleteUserSchema>
