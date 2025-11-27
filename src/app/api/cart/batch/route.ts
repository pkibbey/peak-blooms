import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isApproved } from "@/lib/auth-utils"
import { db } from "@/lib/db"

/**
 * POST /api/cart/batch
 * Add multiple items to the user's cart in one request.
 * Body: { productIds: string[], quantities?: number[] | number, productVariantIds?: (string|null)[] }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const approved = await isApproved()
    if (!approved) {
      return NextResponse.json(
        { error: "Your account is not approved for purchases" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { productIds, quantities, productVariantIds } = body

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

    // Resolve optional productVariantIds
    let resolvedVariantIds: (string | null)[] = []
    if (productVariantIds === undefined) {
      resolvedVariantIds = productIds.map(() => null)
    } else if (Array.isArray(productVariantIds)) {
      if (productVariantIds.length !== productIds.length) {
        return NextResponse.json(
          { error: "productVariantIds array length must match productIds" },
          { status: 400 }
        )
      }
      resolvedVariantIds = productVariantIds.map((v) => (v === null ? null : String(v)))
    } else {
      return NextResponse.json(
        { error: "productVariantIds must be an array if provided" },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get or create cart
    let cart = await db.shoppingCart.findUnique({ where: { userId: user.id } })
    if (!cart) {
      cart = await db.shoppingCart.create({ data: { userId: user.id } })
    }

    // Build and execute operations in a transaction for ACID compliance
    const results = await db.$transaction(async (tx) => {
      const items = []
      for (let i = 0; i < productIds.length; i++) {
        const productId = String(productIds[i])
        const quantity = Math.max(1, Number(resolvedQuantities[i] ?? 1))
        const productVariantId = resolvedVariantIds[i] ?? null

        const existingItem = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId,
            productVariantId: productVariantId || null,
          },
        })

        let item: Awaited<ReturnType<typeof tx.cartItem.create>>
        if (existingItem) {
          item = await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity },
            include: { product: true, productVariant: true },
          })
        } else {
          item = await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              productVariantId: productVariantId || null,
              quantity,
            },
            include: { product: true, productVariant: true },
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
