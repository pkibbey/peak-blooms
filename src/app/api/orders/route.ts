import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { createOrderSchema } from "@/lib/validations/checkout"

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

    const { deliveryAddressId, deliveryAddress, saveDeliveryAddress, notes } = validationResult.data

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
          email: deliveryAddress.email,
          phone: deliveryAddress.phone,
        },
      })

      finalDeliveryAddressId = newAddress.id
    } else {
      return NextResponse.json({ error: "Delivery address is required" }, { status: 400 })
    }

    // Transition the order from CART to PENDING
    const order = await db.order.update({
      where: { id: cart.id },
      data: {
        status: "PENDING",
        total: Math.round(total * 100) / 100,
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
