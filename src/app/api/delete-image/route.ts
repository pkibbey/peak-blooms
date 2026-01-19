import { NextResponse } from "next/server"
import { deleteBlobAction } from "@/app/actions/blob"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { deleteBlobSchema } from "@/lib/validations/blob"

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { productId?: string; imageUrl: string }
    const { productId, imageUrl } = body

    deleteBlobSchema.parse({ url: imageUrl })

    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 401 })
    }

    // Delete the blob from storage
    let blobDeleted = true
    let blobError: string | null = null

    try {
      const deleteRes = await deleteBlobAction({ url: imageUrl })
      if (!deleteRes.success) {
        blobDeleted = false
        blobError = deleteRes.error || "Failed to delete blob"
        console.warn("Failed to delete blob:", blobError)
      }
    } catch (err) {
      blobDeleted = false
      blobError = err instanceof Error ? err.message : String(err)
      console.warn("Failed to delete blob:", blobError)
    }

    // If productId provided, remove the image reference from product.images regardless of blob delete result
    if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
        select: { images: true },
      })
      if (product) {
        const newImages = product.images.filter((url) => url !== imageUrl)
        await db.product.update({ where: { id: productId }, data: { images: newImages } })
      }
    }

    // Return detailed result so client can show a warning if blob deletion failed
    return NextResponse.json({ success: true, blobDeleted, warning: blobError })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete image"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
