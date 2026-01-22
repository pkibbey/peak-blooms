import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { wrapRoute } from "@/server/error-handler"

export const POST = wrapRoute(async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const body = await request.json()
  const { productId, imageUrl } = body as { productId: string; imageUrl: string }

  if (!productId || !imageUrl) {
    throw new Error("Missing required fields: productId, imageUrl")
  }

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) {
    throw new Error("Product not found")
  }

  const newImages = [...(product.images || []), imageUrl]

  const updated = await db.product.update({
    where: { id: productId },
    data: { images: newImages },
  })

  // Revalidate admin products list route so UI updates quickly
  revalidatePath("/admin/products")
  // Revalidate public product page so storefront reflects the new image
  if (product.slug) {
    revalidatePath(`/shop/${product.slug}`)
  }

  return Response.json({ success: true, data: { id: updated.id, images: updated.images } })
})
