import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

/**
 * PATCH /api/cart/items/[id]
 * Update cart item quantity only
 * Body: { quantity: number }
 * Note: Can only edit items in CART status orders; admins can edit any order
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
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

    // Get the order item and its associated order
    const orderItem = await db.orderItem.findUnique({
      where: { id },
      include: {
        order: true,
        product: true,
      },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check authorization: user can only edit items from their own CART orders
    // Admins can edit any order
    if (user.id !== orderItem.order.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (orderItem.order.status !== "CART" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot edit items in orders that are no longer in CART status" },
        { status: 403 }
      )
    }

    const updatedItem = await db.orderItem.update({
      where: { id },
      data: { quantity },
      include: { product: true },
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error("PATCH /api/cart/items/[id] error:", error)
    return NextResponse.json({ error: "Failed to update cart item" }, { status: 500 })
  }
}

/**
 * DELETE /api/cart/items/[id]
 * Remove item from cart
 * Can only delete items from CART status orders; admins can delete from any order
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the order item and its associated order
    const orderItem = await db.orderItem.findUnique({
      where: { id },
      include: { order: true },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    // Check authorization: user can only delete items from their own CART orders
    // Admins can delete from any order
    if (user.id !== orderItem.order.userId && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (orderItem.order.status !== "CART" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot edit items in orders that are no longer in CART status" },
        { status: 403 }
      )
    }

    await db.orderItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Item removed from cart" }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/cart/items/[id] error:", error)
    return NextResponse.json({ error: "Failed to remove item from cart" }, { status: 500 })
  }
}
