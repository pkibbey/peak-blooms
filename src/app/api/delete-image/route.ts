import { deleteBlobAction } from "@/app/actions/blob"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { deleteBlobSchema } from "@/lib/validations/blob"
import { wrapRoute } from "@/server/error-handler"

export const DELETE = wrapRoute(async function DELETE(request: Request) {
  const body = (await request.json()) as { productId?: string; imageUrl: string }
  const { productId, imageUrl } = body

  deleteBlobSchema.parse({ url: imageUrl })

  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Not authorized")
  }

  // Delete the blob from storage
  let blobDeleted = true
  let blobError: string | null = null

  try {
    const deleteRes = await deleteBlobAction({ url: imageUrl })
    if (!deleteRes.success) {
      blobDeleted = false
      blobError = deleteRes.error || "Failed to delete blob"
    }
  } catch (err) {
    blobDeleted = false
    blobError = err instanceof Error ? err.message : String(err)
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
  return Response.json({ success: true, blobDeleted, warning: blobError })
})
