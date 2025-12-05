import { type NextRequest, NextResponse } from "next/server"
import { calculateCartTotal, getCurrentUser, getOrCreateCart } from "@/lib/current-user"
import { db } from "@/lib/db"

/**
 * GET /api/cart
 * Get current user's shopping cart (approved users only)
 * Prices are automatically adjusted by user's price multiplier via getOrCreateCart()
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

    // Get cart with prices already adjusted by multiplier (pass user to avoid redundant DB call)
    const cart = await getOrCreateCart(user)

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
    const { productId, productVariantId, quantity = 1 } = body

    if (!productId || quantity < 1) {
      return NextResponse.json({ error: "Invalid product or quantity" }, { status: 400 })
    }

    // Get or create cart
    let cart = await db.shoppingCart.findUnique({
      where: { userId: user.id },
    })

    if (!cart) {
      cart = await db.shoppingCart.create({
        data: { userId: user.id },
      })
    }

    // Check if item already in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        productVariantId: productVariantId || null,
      },
    })

    let cartItem: Awaited<ReturnType<typeof db.cartItem.create>>
    if (existingItem) {
      // SET the quantity to the provided value (absolute) rather than incrementing
      cartItem = await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity },
        include: { product: true, productVariant: true },
      })
    } else {
      cartItem = await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          productVariantId: productVariantId || null,
          quantity,
        },
        include: { product: true, productVariant: true },
      })
    }

    return NextResponse.json(cartItem, { status: 201 })
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

    const cart = await db.shoppingCart.findUnique({ where: { userId: user.id } })
    if (!cart) {
      // Nothing to clear
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await db.cartItem.deleteMany({ where: { cartId: cart.id } })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("DELETE /api/cart error:", error)
    return NextResponse.json({ error: "Failed to clear cart" }, { status: 500 })
  }
}
