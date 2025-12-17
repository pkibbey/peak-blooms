import { type NextRequest, NextResponse } from "next/server"
import { calculateCartTotal, getCart, getCurrentUser, getOrCreateCart } from "@/lib/current-user"
import { db } from "@/lib/db"

/**
 * GET /api/cart
 * Get current user's shopping cart (approved users only)
 * Cart is an Order with status = 'CART'
 * Returns 404 if cart doesn't exist (doesn't auto-create)
 * Prices are automatically adjusted by user's price multiplier
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

    // Get existing cart without creating one (avoid ghost carts)
    const cart = await getCart(user)

    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 })
    }

    const total = calculateCartTotal(cart.items)

    return NextResponse.json({
      ...cart,
      total,
    })
  } catch (error) {
    console.error("GET /api/cart error:", error)
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 })
  }
}

/**
 * POST /api/cart
 * Add item to cart or update quantity (approved users only)
 * Cart items are OrderItems on an Order with status = 'CART'
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { productId, quantity = 1 } = body

    if (!productId || quantity < 1) {
      return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 })
    }

    // Get or create cart (Order with status = 'CART')
    let cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!cart) {
      const cartWithItems = await getOrCreateCart(user)
      if (!cartWithItems) {
        return NextResponse.json({ error: "Failed to get cart" }, { status: 500 })
      }
      cart = cartWithItems
    }

    if (!cart) {
      return NextResponse.json({ error: "Failed to get cart" }, { status: 500 })
    }

    // Check if item already in cart
    const existingItem = await db.orderItem.findFirst({
      where: {
        orderId: cart.id,
        productId,
      },
    })

    let orderItem: Awaited<ReturnType<typeof db.orderItem.create>>
    if (existingItem) {
      // SET the quantity to the provided value (absolute) rather than incrementing
      orderItem = await db.orderItem.update({
        where: { id: existingItem.id },
        data: { quantity },
        include: { product: true },
      })
    } else {
      orderItem = await db.orderItem.create({
        data: {
          orderId: cart.id,
          productId,
          quantity,
          price: 0, // Will be calculated at checkout
        },
        include: { product: true },
      })
    }

    return NextResponse.json(orderItem, { status: 201 })
  } catch (error) {
    console.error("POST /api/cart error:", error)
    return NextResponse.json({ error: "Failed to add item to cart" }, { status: 500 })
  }
}

/**
 * DELETE /api/cart
 * Clear all items from the current user's cart
 */
export async function DELETE() {
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

    const cart = await db.order.findFirst({
      where: { userId: user.id, status: "CART" },
      orderBy: { createdAt: "desc" },
    })

    if (!cart) {
      // Nothing to clear
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await db.orderItem.deleteMany({
      where: { orderId: cart.id },
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/cart error:", error)
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 })
  }
}
