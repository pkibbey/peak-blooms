"use server"

import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"
import type { AppResult, CancelOrderResponse, OrderWithItems } from "@/lib/query-types"
import { adjustPrice } from "@/lib/utils"
import {
  type CancelOrderInput,
  type CreateOrderInput,
  cancelOrderSchema,
  createOrderSchema,
  type UpdateOrderItemPriceInput,
  type UpdateOrderStatusInput,
  updateOrderItemPriceSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/checkout"

/**
 * Server action to cancel a PENDING order
 * Can optionally convert it back to CART status
 */
export async function cancelOrderAction(
  input: CancelOrderInput
): Promise<AppResult<CancelOrderResponse>> {
  try {
    const { orderId, convertToCart } = cancelOrderSchema.parse(input)
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: "You must be logged in to cancel an order",
        code: "UNAUTHORIZED",
      }
    }

    // Fetch the order
    const order = await db.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return {
        success: false,
        error: "The order you are trying to cancel does not exist or does not belong to you",
        code: "NOT_FOUND",
      }
    }

    // Only PENDING orders can be cancelled
    if (order.status !== "PENDING") {
      return {
        success: false,
        error: "Only PENDING orders can be cancelled",
        code: "CONFLICT",
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
        data: {
          ...updatedOrder,
          items: order.items,
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
        data: {
          ...cancelledOrder,
          items: order.items,
        },
      }
    }
  } catch (error) {
    return toAppError(error, "Failed to cancel order")
  }
}

/**
 * Create/finalize an order - transition from CART to PENDING with checkout data
 * Approved users only
 */
export async function createOrderAction(
  data: CreateOrderInput
): Promise<AppResult<OrderWithItems>> {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return {
        success: false,
        error: "You must be logged in",
        code: "UNAUTHORIZED",
      }
    }

    if (!user.approved) {
      return {
        success: false,
        error: "Your account is not approved for purchases",
        code: "FORBIDDEN",
      }
    }

    const priceMultiplier = user.priceMultiplier

    // Validate request data
    const { deliveryAddressId, deliveryAddress, saveDeliveryAddress, notes } =
      createOrderSchema.parse(data)

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
      return {
        success: false,
        error: "Your cart is empty",
        code: "CONFLICT",
      }
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
        return {
          success: false,
          error: "The delivery address does not belong to you or does not exist",
          code: "NOT_FOUND",
        }
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
      return {
        success: false,
        error: "Delivery address is required",
        code: "VALIDATION_ERROR",
      }
    }

    // Transition the order from CART to PENDING
    const order = await db.order.findUniqueOrThrow({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    await db.order.update({
      where: { id: cart.id },
      data: {
        status: "PENDING",
        notes: notes || null,
        deliveryAddressId: finalDeliveryAddressId,
      },
    })

    revalidatePath("/account/order-history")
    return {
      success: true,
      data: order,
    }
  } catch (error) {
    return toAppError(error, "Failed to create order")
  }
}

/**
 * Server action to update order status (admin only)
 */
export async function updateOrderStatusAction(
  input: UpdateOrderStatusInput
): Promise<AppResult<OrderWithItems>> {
  try {
    const { orderId, status } = updateOrderStatusSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to update order status",
        code: "UNAUTHORIZED",
      }
    }

    const validStatuses = [
      "CART",
      "PENDING",
      "CONFIRMED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
    ]
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        error: "Invalid status",
        code: "VALIDATION_ERROR",
      }
    }

    // Fetch the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return {
        success: false,
        error: "Order not found",
        code: "NOT_FOUND",
      }
    }

    // Update the order status
    await db.order.update({
      where: { id: orderId },
      data: { status },
    })

    // Fetch updated order with items
    const updatedOrder = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)

    return {
      success: true,
      data: updatedOrder,
    }
  } catch (error) {
    return toAppError(error, "Failed to update order status")
  }
}

/**
 * Server action to update order item price (admin only)
 */
export async function updateOrderItemPriceAction(
  input: UpdateOrderItemPriceInput
): Promise<AppResult<{ id: string; price: number | null; orderTotal: number }>> {
  try {
    const { orderId, itemId, price } = updateOrderItemPriceSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      return {
        success: false,
        error: "You must be an admin to update order item prices",
        code: "UNAUTHORIZED",
      }
    }

    // Fetch the order item
    const orderItem = await db.orderItem.findFirst({
      where: { id: itemId, orderId },
    })

    if (!orderItem) {
      return {
        success: false,
        error: "Order item not found",
        code: "NOT_FOUND",
      }
    }

    // Update the order item price
    await db.orderItem.update({
      where: { id: itemId },
      data: { price },
    })

    // Fetch all items in the order to calculate total for response
    const allItems = await db.orderItem.findMany({
      where: { orderId },
    })

    // Calculate order total (for informational response only)
    const newOrderTotal = allItems.reduce((sum, item) => {
      // Skip null (market-priced) items that haven't been set
      if (item.price === null) return sum
      return sum + (item.price ?? 0) * item.quantity
    }, 0)

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)

    return {
      success: true,
      data: {
        id: itemId,
        price,
        orderTotal: Math.round(newOrderTotal * 100) / 100,
      },
    }
  } catch (error) {
    return toAppError(error, "Failed to update order item price")
  }
}
