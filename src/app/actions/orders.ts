"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

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
          total: 0, // Will be recalculated when checking out
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
