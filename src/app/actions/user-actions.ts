"use server"

import { revalidatePath } from "next/cache"
import type { Address } from "@/generated/client"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, UserProfileResponse } from "@/lib/query-types"
import {
  type AddressFormData,
  addressSchema,
  type DeleteAddressInput,
  deleteAddressSchema,
} from "@/lib/validations/address"
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth"

/**
 * Update current user's profile (name only)
 * Email cannot be changed - it's verified by Google OAuth
 */
export async function updateProfileAction(
  data: ProfileFormData
): Promise<AppResult<UserProfileResponse>> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update your profile",
        code: "UNAUTHORIZED",
      }
    }

    const validatedData = profileSchema.parse(data)

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: validatedData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        role: true,
        approved: true,
        createdAt: true,
      },
    })

    revalidatePath("/account")
    return {
      success: true,
      data: user,
    }
  } catch (error) {
    return toAppError(error, "Failed to update profile")
  }
}

/**
 * Create a new address for the current user
 */
export async function createAddressAction(
  data: AddressFormData & { isDefault?: boolean }
): Promise<AppResult<Address>> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to create an address",
        code: "UNAUTHORIZED",
      }
    }

    const validatedData = addressSchema.parse(data)

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.address.create({
      data: {
        userId: session.user.id,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        company: validatedData.company || "",
        street1: validatedData.street1,
        street2: validatedData.street2 || "",
        city: validatedData.city,
        state: validatedData.state,
        zip: validatedData.zip,
        country: validatedData.country,
        email: validatedData.email,
        phone: validatedData.phone,
        isDefault: data.isDefault || false,
      },
    })

    revalidatePath("/account")
    return {
      success: true,
      data: address,
    }
  } catch (error) {
    return toAppError(error, "Failed to create address")
  }
}

/**
 * Update an address for the current user
 */
export async function updateAddressAction(
  addressId: string,
  data: Partial<AddressFormData & { isDefault?: boolean }>
): Promise<AppResult<Address>> {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to update an address",
        code: "UNAUTHORIZED",
      }
    }

    // Verify ownership
    const existingAddress = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!existingAddress || existingAddress.userId !== session.user.id) {
      return {
        success: false,
        error: "Address not found",
        code: "NOT_FOUND",
      }
    }

    // Only validate if data contains address fields
    let validatedData = data
    if (Object.keys(data).some((key) => key !== "isDefault")) {
      validatedData = addressSchema.partial().parse(data)
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      })
    }

    const updateData: Record<string, unknown> = {}

    if (validatedData.firstName !== undefined) updateData.firstName = validatedData.firstName
    if (validatedData.lastName !== undefined) updateData.lastName = validatedData.lastName
    if (validatedData.company !== undefined) updateData.company = validatedData.company || ""
    if (validatedData.street1 !== undefined) updateData.street1 = validatedData.street1
    if (validatedData.street2 !== undefined) updateData.street2 = validatedData.street2 || ""
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.state !== undefined) updateData.state = validatedData.state
    if (validatedData.zip !== undefined) updateData.zip = validatedData.zip
    if (validatedData.country !== undefined) updateData.country = validatedData.country
    if (validatedData.email !== undefined) updateData.email = validatedData.email
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

    const address = await db.address.update({
      where: { id: addressId },
      data: updateData,
    })

    revalidatePath("/account")
    return {
      success: true,
      data: address,
    }
  } catch (error) {
    return toAppError(error, "Failed to update address")
  }
}

/**
 * Delete an address for the current user
 */
export async function deleteAddressAction(
  input: DeleteAddressInput
): Promise<AppResult<{ id: string }>> {
  try {
    const { addressId } = deleteAddressSchema.parse(input)
    const session = await getSession()

    if (!session?.user?.id) {
      return {
        success: false,
        error: "You must be logged in to delete an address",
        code: "UNAUTHORIZED",
      }
    }

    // Verify ownership
    const address = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!address || address.userId !== session.user.id) {
      return {
        success: false,
        error: "Address not found",
        code: "NOT_FOUND",
      }
    }

    await db.address.delete({
      where: { id: addressId },
    })

    revalidatePath("/account")
    return {
      success: true,
      data: { id: addressId },
    }
  } catch (error) {
    return toAppError(error, "Failed to delete address")
  }
}
