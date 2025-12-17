"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { type AddressFormData, addressSchema } from "@/lib/validations/address"
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth"

/**
 * Update current user's profile (name only)
 * Email cannot be changed - it's verified by Google OAuth
 */
export async function updateProfileAction(data: ProfileFormData) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const validationResult = profileSchema.safeParse(data)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      throw new Error(firstError?.message || "Invalid profile data")
    }

    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: validationResult.data.name,
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
    return user
  } catch (error) {
    console.error("updateProfileAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update profile")
  }
}

/**
 * Get all addresses for the current user
 */
async function getAddressesAction() {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const addresses = await db.address.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return addresses
  } catch (error) {
    console.error("getAddressesAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to fetch addresses")
  }
}

/**
 * Create a new address for the current user
 */
export async function createAddressAction(data: AddressFormData & { isDefault?: boolean }) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const validationResult = addressSchema.safeParse(data)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      throw new Error(firstError?.message || "Invalid address data")
    }

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
        firstName: validationResult.data.firstName,
        lastName: validationResult.data.lastName,
        company: validationResult.data.company || "",
        street1: validationResult.data.street1,
        street2: validationResult.data.street2 || "",
        city: validationResult.data.city,
        state: validationResult.data.state,
        zip: validationResult.data.zip,
        country: validationResult.data.country,
        email: validationResult.data.email,
        phone: validationResult.data.phone,
        isDefault: data.isDefault || false,
      },
    })

    revalidatePath("/account")
    return address
  } catch (error) {
    console.error("createAddressAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create address")
  }
}

/**
 * Update an address for the current user
 */
export async function updateAddressAction(
  addressId: string,
  data: Partial<AddressFormData & { isDefault?: boolean }>
) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Verify ownership
    const existingAddress = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!existingAddress || existingAddress.userId !== session.user.id) {
      throw new Error("Address not found")
    }

    // Only validate if data contains address fields
    if (Object.keys(data).some((key) => key !== "isDefault")) {
      const validationResult = addressSchema.safeParse(data)
      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0]
        throw new Error(firstError?.message || "Invalid address data")
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.address.updateMany({
        where: { userId: session.user.id, isDefault: true, NOT: { id: addressId } },
        data: { isDefault: false },
      })
    }

    const updateData: Record<string, unknown> = {}

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.company !== undefined) updateData.company = data.company || ""
    if (data.street1 !== undefined) updateData.street1 = data.street1
    if (data.street2 !== undefined) updateData.street2 = data.street2 || ""
    if (data.city !== undefined) updateData.city = data.city
    if (data.state !== undefined) updateData.state = data.state
    if (data.zip !== undefined) updateData.zip = data.zip
    if (data.country !== undefined) updateData.country = data.country
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault

    const address = await db.address.update({
      where: { id: addressId },
      data: updateData,
    })

    revalidatePath("/account")
    return address
  } catch (error) {
    console.error("updateAddressAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to update address")
  }
}

/**
 * Delete an address for the current user
 */
export async function deleteAddressAction(addressId: string) {
  try {
    const session = await getSession()

    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    // Verify ownership
    const address = await db.address.findUnique({
      where: { id: addressId },
    })

    if (!address || address.userId !== session.user.id) {
      throw new Error("Address not found")
    }

    await db.address.delete({
      where: { id: addressId },
    })

    revalidatePath("/account")
    return { success: true }
  } catch (error) {
    console.error("deleteAddressAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to delete address")
  }
}
