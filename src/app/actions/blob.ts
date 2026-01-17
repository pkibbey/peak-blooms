"use server"

import { getSession } from "@/lib/auth"
import { ENV } from "@/lib/env"
import { toAppError } from "@/lib/error-utils"
import type { AppResult } from "@/lib/query-types"
import { type DeleteBlobInput, deleteBlobSchema } from "@/lib/validations/blob"

/**
 * Server action to delete a blob file from Vercel Blob storage (admin only)
 */
export async function deleteBlobAction(
  input: DeleteBlobInput
): Promise<AppResult<{ success: boolean }>> {
  try {
    const { url } = deleteBlobSchema.parse(input)

    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to delete blobs",
        code: "UNAUTHORIZED",
      }
    }

    // Only delete if it's a Vercel Blob URL
    if (!url.includes("blob.vercel-storage.com")) {
      return { success: true, data: { success: true } }
    }

    const response = await fetch("https://blob.vercel-storage.com/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      // Don't throw - blob cleanup is not critical
      return {
        success: false,
        error: `Failed to delete blob: ${response.statusText}`,
        code: "SERVER_ERROR",
      }
    }

    return { success: true, data: { success: true } }
  } catch (error) {
    return toAppError(error, "Failed to delete blob")
  }
}
