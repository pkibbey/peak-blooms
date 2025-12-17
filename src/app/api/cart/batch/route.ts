import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser, getOrCreateCart } from "@/lib/current-user"
import { db } from "@/lib/db"

/**
 * POST /api/cart/batch
 * Add multiple items to the user's cart in one request.
 * Body: { productIds: string[], quantities?: number[] | number }
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
    const { productIds, quantities } = body

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ error: "productIds must be a non-empty array" }, { status: 400 })
    }

    // Determine per-item quantities. Support single number or array matching productIds length.
    let resolvedQuantities: number[] = []
    if (typeof quantities === "number") {
      resolvedQuantities = productIds.map(() => quantities)
    } else if (Array.isArray(quantities)) {
      if (quantities.length !== productIds.length) {
        return NextResponse.json(
          { error: "quantities array length must match productIds" },
          { status: 400 }
        )
      }
      resolvedQuantities = quantities.map((q) => (typeof q === "number" && q > 0 ? q : 1))
    } else {
      resolvedQuantities = productIds.map(() => 1)
    }

    // Get or create cart (Order with status = 'CART')
    const cart = await getOrCreateCart(user)
    if (!cart || !cart.id) {
      return NextResponse.json({ error: "Failed to get cart" }, { status: 500 })
    }

    // Build and execute operations in a transaction for ACID compliance
    const results = await db.$transaction(async (tx) => {
      const items = []
      for (let i = 0; i < productIds.length; i++) {
        const productId = String(productIds[i])
        const quantity = Math.max(1, Number(resolvedQuantities[i] ?? 1))

        const existingItem = await tx.orderItem.findFirst({
          where: {
            orderId: cart.id as string,
            productId,
          },
        })

        let item: Awaited<ReturnType<typeof tx.orderItem.create>>
        if (existingItem) {
          // Set the item's quantity to the provided absolute quantity
          item = await tx.orderItem.update({
            where: { id: existingItem.id },
            data: { quantity },
            include: { product: true },
          })
        } else {
          item = await tx.orderItem.create({
            data: {
              orderId: cart.id as string,
              productId,
              quantity,
              price: null, // Market-priced item
            },
            include: { product: true },
          })
        }
        items.push(item)
      }
      return items
    })

    return NextResponse.json(results, { status: 201 })
  } catch (error) {
    console.error("POST /api/cart/batch error:", error)
    return NextResponse.json({ error: "Failed to add items to cart" }, { status: 500 })
  }
}
