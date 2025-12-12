import { NextResponse } from "next/server"
import { OrderStatus } from "@/generated/enums"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/admin/orders/[id]
 * Get a specific order (admin only)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const order = await db.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
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

    return NextResponse.json(order)
  } catch (error) {
    console.error("GET /api/admin/orders/[id] error:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * Update order details (admin only)
 * Can update: status, email, phone, notes, deliveryAddressId, items
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, email, phone, notes, deliveryAddressId } = body

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id },
    })

    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Build update data - only include provided fields
    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      // Validate status
      if (!Object.values(OrderStatus).includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }
      updateData.status = status
    }

    if (email !== undefined) {
      updateData.email = email
    }

    if (phone !== undefined) {
      updateData.phone = phone
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (deliveryAddressId !== undefined) {
      // Validate that the address exists
      const address = await db.address.findUnique({
        where: { id: deliveryAddressId },
      })
      if (!address) {
        return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 })
      }
      updateData.deliveryAddressId = deliveryAddressId
    }

    // Update order
    const updatedOrder = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        deliveryAddress: true,
      },
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
