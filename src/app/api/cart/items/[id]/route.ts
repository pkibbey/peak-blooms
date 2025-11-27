import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { type NextRequest, NextResponse } from "next/server"

/**
 * PATCH /api/cart/items/[id]
 * Update cart item quantity only
 * Body: { quantity: number }
 * Note: Variant changes are no longer supported - users must remove and re-add items
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { quantity } = body

    if (quantity === undefined) {
      return NextResponse.json({ error: "Quantity is required" }, { status: 400 })
    }

    if (quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 })
    }

    const cartItem = await db.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: true, productVariant: true },
    })

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error("PATCH /api/cart/items/[id] error:", error)
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
  }
}

/**
 * DELETE /api/cart/items/[id]
 * Remove item from cart
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.cartItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Item removed from cart" }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/cart/items/[id] error:", error)
    return NextResponse.json({ error: "Failed to remove item from cart" }, { status: 500 })
  }
}
