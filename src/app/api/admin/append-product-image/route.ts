import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Append Product Image API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, imageUrl } = body as { productId: string; imageUrl: string }

    if (!productId || !imageUrl) {
      console.error("[Append Product Image API] Missing required fields")
      return Response.json(
        { error: "Missing required fields: productId, imageUrl" },
        { status: 400 }
      )
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      console.error("[Append Product Image API] Product not found")
      return Response.json({ error: "Product not found" }, { status: 404 })
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
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Append Product Image API] Error:", errorMessage, err)
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
