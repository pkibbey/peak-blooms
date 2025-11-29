import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isApproved } from "@/lib/auth-utils"
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
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is approved
    const approved = await isApproved()
    if (!approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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
 * Create a new order from shopping cart (approved users only)
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is approved
    const approved = await isApproved()
    if (!approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        priceMultiplier: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
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

    const {
      shippingAddressId,
      shippingAddress,
      saveShippingAddress,
      billingAddress,
      email,
      phone,
      notes,
    } = validationResult.data

    // Get user's cart
    const cart = await db.shoppingCart.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    })

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Calculate total using variant pricing with price multiplier applied
    const total = cart.items.reduce((sum: number, item) => {
      const basePrice = item.productVariant?.price ?? 0
      const adjustedPrice = adjustPrice(basePrice, priceMultiplier)
      return sum + adjustedPrice * item.quantity
    }, 0)

    // Handle shipping address
    let finalShippingAddressId: string

    if (shippingAddressId) {
      // Using existing address - verify it belongs to user
      const existingAddress = await db.address.findFirst({
        where: {
          id: shippingAddressId,
          userId: user.id,
        },
      })

      if (!existingAddress) {
        return NextResponse.json({ error: "Invalid shipping address" }, { status: 400 })
      }

      finalShippingAddressId = shippingAddressId
    } else if (shippingAddress) {
      // Creating new address
      const newAddress = await db.address.create({
        data: {
          userId: saveShippingAddress ? user.id : null,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          company: shippingAddress.company || null,
          street1: shippingAddress.street1,
          street2: shippingAddress.street2 || null,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zip: shippingAddress.zip,
          country: shippingAddress.country || "US",
        },
      })

      finalShippingAddressId = newAddress.id
    } else {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 })
    }

    // Handle billing address (optional)
    let finalBillingAddressId: string | null = null

    if (billingAddress) {
      const newBillingAddress = await db.address.create({
        data: {
          userId: null, // Billing addresses are not saved to user profile
          firstName: billingAddress.firstName,
          lastName: billingAddress.lastName,
          company: billingAddress.company || null,
          street1: billingAddress.street1,
          street2: billingAddress.street2 || null,
          city: billingAddress.city,
          state: billingAddress.state,
          zip: billingAddress.zip,
          country: billingAddress.country || "US",
        },
      })

      finalBillingAddressId = newBillingAddress.id
    }

    // Generate order number
    const orderNumber = await generateOrderNumber()

    // Create order with items (storing adjusted prices)
    const order = await db.order.create({
      data: {
        orderNumber,
        userId: user.id,
        total: Math.round(total * 100) / 100,
        status: "PENDING",
        email,
        phone: phone || null,
        notes: notes || null,
        shippingAddressId: finalShippingAddressId,
        billingAddressId: finalBillingAddressId,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            price: adjustPrice(item.productVariant?.price ?? 0, priceMultiplier),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
      },
    })

    // Clear the cart
    await db.cartItem.deleteMany({
      where: { cartId: cart.id },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error("POST /api/orders error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
