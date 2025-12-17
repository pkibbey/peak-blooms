import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

/**
 * PATCH /api/orders/cancel/[id]
 * Cancel a PENDING order and optionally convert it back to CART
 * User must own the order
 */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const orderId = url.pathname.split("/").pop()

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { convertToCart } = body

    // Fetch the order
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        deliveryAddress: true,
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Only PENDING orders can be cancelled
    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error: `Cannot cancel order with status ${order.status}. Only PENDING orders can be cancelled.`,
        },
        { status: 400 }
      )
    }

    if (convertToCart) {
      // Convert order back to CART status
      // Clear snapshot fields so product prices/details are fresh
      await Promise.all(
        order.items.map((item) =>
          db.orderItem.update({
            where: { id: item.id },
            data: {
              productNameSnapshot: null,
              productImageSnapshot: null,
            },
          })
        )
      )

      const updatedOrder = await db.order.update({
        where: { id: order.id },
        data: {
          status: "CART",
          total: 0, // Will be recalculated when checking out
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          deliveryAddress: true,
        },
      })

      return NextResponse.json(updatedOrder, { status: 200 })
    } else {
      // Simply transition to CANCELLED
      const cancelledOrder = await db.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          deliveryAddress: true,
        },
      })

      return NextResponse.json(cancelledOrder, { status: 200 })
    }
  } catch (error) {
    console.error("PATCH /api/orders/cancel error:", error)
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 })
  }
}
