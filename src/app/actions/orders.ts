"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import { adjustPrice } from "@/lib/utils"
import { type CreateOrderInput, createOrderSchema } from "@/lib/validations/checkout"

export interface CancelOrderResponse {
  success: boolean
  message: string
  order?: {
    id: string
    orderNumber: string
    status: string
  }
  error?: string
}

/**
 * Server action to cancel a PENDING order
 * Can optionally convert it back to CART status
 */
export async function cancelOrderAction(
  orderId: string,
  convertToCart: boolean = false
): Promise<CancelOrderResponse> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        message: "Unauthorized",
        error: "You must be logged in to cancel an order",
      }
    }

    // Fetch the order
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        items: true,
      },
    })

    if (!order) {
      return {
        success: false,
        message: "Order not found",
        error: "The order you are trying to cancel does not exist or does not belong to you",
      }
    }

    // Only PENDING orders can be cancelled
    if (order.status !== "PENDING") {
      return {
        success: false,
        message: `Cannot cancel order with status ${order.status}`,
        error: "Only PENDING orders can be cancelled",
      }
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
        },
      })

      revalidatePath("/cart")
      revalidatePath(`/account/order-history/${orderId}`)

      return {
        success: true,
        message: "Order converted back to cart",
        order: {
          id: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: updatedOrder.status,
        },
      }
    } else {
      // Simply transition to CANCELLED
      const cancelledOrder = await db.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      })

      revalidatePath(`/account/order-history/${orderId}`)
      revalidatePath("/account/order-history")

      return {
        success: true,
        message: "Order cancelled successfully",
        order: {
          id: cancelledOrder.id,
          orderNumber: cancelledOrder.orderNumber,
          status: cancelledOrder.status,
        },
      }
    }
  } catch (error) {
    console.error("cancelOrderAction error:", error)
    return {
      success: false,
      message: "Failed to cancel order",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Create/finalize an order - transition from CART to PENDING with checkout data
 * Approved users only
 */
export async function createOrderAction(data: CreateOrderInput) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error("Unauthorized")
    }

    if (!user.approved) {
      throw new Error("Your account is not approved for purchases")
    }

    const priceMultiplier = user.priceMultiplier

    // Validate request data
    const validationResult = createOrderSchema.safeParse(data)

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      throw new Error(firstError?.message || "Invalid request data")
    }

    const { deliveryAddressId, deliveryAddress, saveDeliveryAddress, notes } = validationResult.data

    // Get user's cart (CART order)
    const cart = await db.order.findFirst({
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

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty")
    }

    // Update order items with product snapshots and capture current prices at checkout time
    await Promise.all(
      cart.items.map((item) =>
        db.orderItem.update({
          where: { id: item.id },
          data: {
            productNameSnapshot: item.product?.name || null,
            productImageSnapshot: item.product?.image || null,
            // Capture current product price (or null if market-priced)
            // Null indicates market-priced item to be set by admin later
            price:
              item.product?.price === null
                ? null
                : adjustPrice(item.product?.price ?? 0, priceMultiplier),
          },
        })
      )
    )

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
        throw new Error("Invalid delivery address")
      }

      finalDeliveryAddressId = deliveryAddressId
    } else if (deliveryAddress) {
      // Creating new address
      const newAddress = await db.address.create({
        data: {
          userId: saveDeliveryAddress ? user.id : null,
          firstName: deliveryAddress.firstName,
          lastName: deliveryAddress.lastName,
          company: deliveryAddress.company || "",
          street1: deliveryAddress.street1,
          street2: deliveryAddress.street2 || "",
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
      throw new Error("Delivery address is required")
    }

    // Transition the order from CART to PENDING
    const order = await db.order.update({
      where: { id: cart.id },
      data: {
        status: "PENDING",
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

    revalidatePath("/account/order-history")
    return order
  } catch (error) {
    console.error("createOrderAction error:", error)
    throw new Error(error instanceof Error ? error.message : "Failed to create order")
  }
}
