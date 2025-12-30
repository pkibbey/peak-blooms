"use server"

import { getSession } from "@/lib/auth"
import { type DeleteBlobInput, deleteBlobSchema } from "@/lib/validations/blob"

/**
 * Server action to delete a blob file from Vercel Blob storage (admin only)
 */
export async function deleteBlobAction(input: DeleteBlobInput): Promise<{ success: boolean }> {
  try {
    const { url } = deleteBlobSchema.parse(input)

    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    // Only delete if it's a Vercel Blob URL
    if (!url.includes("blob.vercel-storage.com")) {
      return { success: true } // Not a blob URL, consider it successful
    }

    const response = await fetch("https://blob.vercel-storage.com/delete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    })

    if (!response.ok) {
      // Don't throw - blob cleanup is not critical
      return { success: false }
    }

    return { success: true }
  } catch {
    // Don't throw - blob cleanup is not critical
    return { success: false }
  }
}
