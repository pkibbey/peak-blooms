import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"

/**
 * POST /api/admin/orders
 * Create a new CART order for a customer (admin only)
 * Body: {
 *   userId: string,
 *   items: Array<{productId: string, quantity: number}>,
 *   email?: string,
 *   phone?: string,
 *   notes?: string,
 *   deliveryAddressId?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { userId, items, email, phone, notes, deliveryAddressId } = body

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "userId and items array are required" }, { status: 400 })
    }

    // Verify customer exists
    const customer = await db.user.findUnique({
      where: { id: userId },
    })

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    // Generate order number
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

    const orderNumber = `PB-${nextNumber.toString().padStart(5, "0")}`

    // Determine delivery address
    let finalDeliveryAddressId: string

    if (deliveryAddressId) {
      // Verify the address exists and belongs to the customer
      const address = await db.address.findFirst({
        where: {
          id: deliveryAddressId,
          userId: userId,
        },
      })

      if (!address) {
        return NextResponse.json({ error: "Invalid delivery address" }, { status: 400 })
      }

      finalDeliveryAddressId = deliveryAddressId
    } else {
      // Create a temporary placeholder address
      const tempAddress = await db.address.create({
        data: {
          userId: userId,
          firstName: "",
          lastName: "",
          company: "",
          street1: "",
          city: "",
          state: "",
          zip: "",
          country: "US",
          email: email || customer.email || "",
          phone: phone || "",
        },
      })

      finalDeliveryAddressId = tempAddress.id
    }

    // Validate and create order items
    // Get all products at once for efficiency
    const productIds = items.map((item: { productId: string }) => item.productId)
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    })

    const productMap = new Map(products.map((p) => [p.id, p]))

    const orderItems = items.map((item: { productId: string; quantity: number }) => {
      const product = productMap.get(item.productId)
      if (!product) {
        throw new Error(`Product ${item.productId} not found`)
      }

      if (product.price === null) {
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: null,
        }
      }

      const price = adjustPrice(product.price, customer.priceMultiplier ?? 1.0)

      return {
        productId: item.productId,
        quantity: item.quantity,
        price,
      }
    })

    // Create the CART order with items
    const newOrder = await db.order.create({
      data: {
        orderNumber,
        userId: userId,
        status: "CART",
        notes: notes || null,
        deliveryAddressId: finalDeliveryAddressId,
        items: {
          create: orderItems,
        },
      },
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

    return NextResponse.json(newOrder, { status: 201 })
  } catch (error) {
    console.error("POST /api/admin/orders error:", error)

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
