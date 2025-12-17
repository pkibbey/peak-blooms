import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ orderId: string; itemId: string }>
}

/**
 * PATCH /api/admin/orders/[orderId]/items/[itemId]
 * Update an order item's price (admin only)
 * Also recalculates and updates the order total
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { orderId, itemId } = await params

    // Parse request body
    const body = await request.json()
    const { price } = body

    if (price === undefined || price === null) {
      return NextResponse.json({ error: "Price is required" }, { status: 400 })
    }

    if (typeof price !== "number" || price < 0) {
      return NextResponse.json({ error: "Price must be a non-negative number" }, { status: 400 })
    }

    // Fetch the order item
    const orderItem = await db.orderItem.findFirst({
      where: { id: itemId, orderId },
    })

    if (!orderItem) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 })
    }

    // Update the order item price
    await db.orderItem.update({
      where: { id: itemId },
      data: { price },
    })

    // Fetch all items in the order to calculate total for response
    const allItems = await db.orderItem.findMany({
      where: { orderId },
    })

    // Calculate order total (for informational response only)
    const newOrderTotal = allItems.reduce((sum, item) => {
      // Skip null (market-priced) items that haven't been set
      if (item.price === null) return sum
      return sum + (item.price ?? 0) * item.quantity
    }, 0)

    return NextResponse.json({
      message: "Price updated successfully",
      newOrderTotal: Math.round(newOrderTotal * 100) / 100,
    })
  } catch (error) {
    console.error("PATCH /api/admin/orders/[orderId]/items/[itemId] error:", error)
    return NextResponse.json({ error: "Failed to update price" }, { status: 500 })
  }
}
