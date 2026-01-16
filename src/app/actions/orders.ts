"use server"

import { revalidatePath } from "next/cache"
import { ZodError } from "zod"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import type { CancelOrderResponse, OrderWithItems } from "@/lib/query-types"
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
export async function cancelOrderAction(input: CancelOrderInput): Promise<CancelOrderResponse> {
  try {
    const { orderId, convertToCart } = cancelOrderSchema.parse(input)
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
        message: "Order cancelled successfully",
        order: {
          ...cancelledOrder,
          items: order.items,
        },
      }
    }
  } catch (error) {
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
export async function createOrderAction(data: CreateOrderInput): Promise<OrderWithItems> {
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
    return order
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid order data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to create order")
  }
}

/**
 * Server action to update order status (admin only)
 */
export async function updateOrderStatusAction(
  input: UpdateOrderStatusInput
): Promise<{ message: string; order: OrderWithItems }> {
  try {
    const { orderId, status } = updateOrderStatusSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized")
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
      throw new Error("Invalid status")
    }

    // Fetch the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      throw new Error("Order not found")
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
      message: "Order status updated successfully",
      order: updatedOrder,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid status")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update order status")
  }
}

/**
 * Server action to update order item price (admin only)
 */
export async function updateOrderItemPriceAction(input: UpdateOrderItemPriceInput): Promise<{
  message: string
  item: { id: string; price: number | null }
  orderTotal: number
}> {
  try {
    const { orderId, itemId, price } = updateOrderItemPriceSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized")
    }

    // Fetch the order item
    const orderItem = await db.orderItem.findFirst({
      where: { id: itemId, orderId },
    })

    if (!orderItem) {
      throw new Error("Order item not found")
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
      message: "Price updated successfully",
      item: { id: itemId, price },
      orderTotal: Math.round(newOrderTotal * 100) / 100,
    }
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Invalid price data")
    }
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to update price")
  }
}
