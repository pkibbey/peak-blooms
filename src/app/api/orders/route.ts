import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { createOrderSchema } from "@/lib/validations/checkout"

/**
 * Generate the next order number in sequence (PB-00001, PB-00002, etc.)
 */
async function generateOrderNumber(): Promise<string> {
  const lastOrder = await db.order.findFirst({
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  })

  let nextNumber = 1
  if (lastOrder?.orderNumber) {
    const match = lastOrder.orderNumber.match(/PB-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `PB-${nextNumber.toString().padStart(5, "0")}`
}

/**
 * GET /api/orders
 * Get current user's orders (approved users only)
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      )
    }

    const orders = await db.order.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(orders)
  } catch (error) {
    console.error("GET /api/orders error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

/**
 * POST /api/orders
 * Finalize a CART order (transition from CART to PENDING) with checkout data (approved users only)
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!user.approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      )
    }

    const priceMultiplier = user.priceMultiplier

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createOrderSchema.safeParse(body)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || "Invalid request data" },
        { status: 400 }
      )
    }

    const { deliveryAddressId, deliveryAddress, saveDeliveryAddress, email, phone, notes } =
      validationResult.data

    // Get user's cart (CART order)
    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Calculate total using product pricing with price multiplier applied
    const total = cart.items.reduce((sum: number, item) => {
      const basePrice = item.product?.price ?? 0
      const adjustedPrice = adjustPrice(basePrice, priceMultiplier)
      return sum + adjustedPrice * item.quantity
    }, 0)

    // Handle delivery address
    let finalDeliveryAddressId: string

    if (deliveryAddressId) {
      // Using existing address - verify it belongs to user
      const existingAddress = await db.address.findFirst({
        where: {
          id: deliveryAddressId,
          userId: user.id,
        },
      })

      if (!existingAddress) {
        return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 })
      }

      finalDeliveryAddressId = deliveryAddressId
    } else if (deliveryAddress) {
      // Creating new address
      const newAddress = await db.address.create({
        data: {
          userId: saveDeliveryAddress ? user.id : null,
          firstName: deliveryAddress.firstName,
          lastName: deliveryAddress.lastName,
          company: deliveryAddress.company,
          street1: deliveryAddress.street1,
          street2: deliveryAddress.street2 || null,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
          country: deliveryAddress.country || "US",
        },
      })

      finalDeliveryAddressId = newAddress.id
    } else {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 })
    }

    // Update user's phone if provided
    if (phone && phone !== user.phone) {
      await db.user.update({
        where: { id: user.id },
        data: { phone },
      })
    }

    // Update the CART order items with final prices and transition to PENDING
    // First, update all OrderItems with final adjusted prices
    await db.$transaction(
      cart.items.map((item) =>
        db.orderItem.update({
          where: { id: item.id },
          data: {
            price: adjustPrice(item.product?.price ?? 0, priceMultiplier),
          },
        })
      )
    )

    // Transition the order from CART to PENDING
    const order = await db.order.update({
      where: { id: cart.id },
      data: {
        status: "PENDING",
        total: Math.round(total * 100) / 100,
        email,
        phone: phone || null,
        notes: notes || null,
        deliveryAddressId: finalDeliveryAddressId,
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

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
