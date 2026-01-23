"use server"

import { revalidatePath } from "next/cache"
import { calculateMinimumTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import type { CancelOrderResponse, OrderWithItems } from "@/lib/query-types"
import { adjustPrice } from "@/lib/utils"
import {
  type AdminCreateOrderInput,
  adminCreateOrderSchema,
  type CancelOrderInput,
  type CreateOrderInput,
  cancelOrderSchema,
  createOrderSchema,
  type UpdateOrderItemPriceInput,
  type UpdateOrderStatusInput,
  updateOrderItemPriceSchema,
  updateOrderStatusSchema,
} from "@/lib/validations/checkout"
import { wrapAction } from "@/server/error-handler"

/**
 * Server action to cancel a PENDING order
 * Can optionally convert it back to CART status
 */
export const cancelOrderAction = wrapAction(
  async (input: CancelOrderInput): Promise<CancelOrderResponse> => {
    const { orderId, convertToCart } = cancelOrderSchema.parse(input)
    const user = await getCurrentUser()
    if (!user) {
      throw new Error("Unauthorized: You must be logged in to cancel an order")
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
      throw new Error("The order you are trying to cancel does not exist or does not belong to you")
    }

    // Only PENDING orders can be cancelled
    if (order.status !== "PENDING") {
      throw new Error("Conflict: Only PENDING orders can be cancelled")
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
        ...updatedOrder,
        items: order.items,
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
        ...cancelledOrder,
        items: order.items,
      }
    }
  }
)

/**
 * Create/finalize an order - transition from CART to PENDING with checkout data
 * Approved users only
 */
export const createOrderAction = wrapAction(
  async (data: CreateOrderInput): Promise<OrderWithItems> => {
    const user = await getCurrentUser()

    if (!user) {
      throw new Error("Unauthorized: You must be logged in")
    }

    if (!user.approved) {
      throw new Error("Forbidden: Your account is not approved for purchases")
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
      throw new Error("Conflict: Your cart is empty")
    }

    // Update order items with product snapshots and capture current prices at checkout time
    await Promise.all(
      cart.items.map((item) =>
        db.orderItem.update({
          where: { id: item.id },
          data: {
            productNameSnapshot: item.product?.name || null,
            productImageSnapshot: item.product?.images?.[0] || null, // Capture first image (featured)
            // Capture current product price (or 0 if market-priced)
            // 0 indicates market-priced item to be set by admin later
            price: adjustPrice(item.product?.price ?? 0, priceMultiplier),
          },
        })
      )
    )

    // (minimum enforcement moved below so delivery address validation runs first)

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
        throw new Error("Not found: The delivery address does not belong to you or does not exist")
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

    // Enforce minimum order amount for finalization.
    // For validation we treat market-priced items (price === 0) as $10 each.
    const minimumTotal = calculateMinimumTotal(
      cart.items.map((it) => ({
        product: { price: adjustPrice(it.product?.price ?? 0, priceMultiplier) },
        quantity: it.quantity,
      }))
    )

    if (minimumTotal < 200) {
      throw new Error(
        "Order subtotal does not meet minimum required amount of $200 (market items counted as $10 each)."
      )
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
  }
)

/**
 * Server action to update order status (admin only)
 */
export const updateOrderStatusAction = wrapAction(
  async (input: UpdateOrderStatusInput): Promise<OrderWithItems> => {
    const { orderId, status } = updateOrderStatusSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to update order status")
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

    return updatedOrder
  }
)

/**
 * Server action to update order item price (admin only)
 */
export const updateOrderItemPriceAction = wrapAction(
  async (
    input: UpdateOrderItemPriceInput
  ): Promise<{ id: string; price: number; orderTotal: number }> => {
    const { orderId, itemId, price } = updateOrderItemPriceSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("You must be an admin to update order item prices")
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
      // Skip 0 (market-priced) items that haven't been set
      if (item.price === 0) return sum
      return sum + (item.price ?? 0) * item.quantity
    }, 0)

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)

    return {
      id: itemId,
      price,
      orderTotal: Math.round(newOrderTotal * 100) / 100,
    }
  }
)
/**
 * Server action for admins to manually create orders
 */
export const adminCreateOrderAction = wrapAction(
  async (data: AdminCreateOrderInput): Promise<OrderWithItems> => {
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to create orders")
    }

    const validatedData = adminCreateOrderSchema.parse(data)

    // Verify the user exists
    const targetUser = await db.user.findUnique({
      where: { id: validatedData.userId },
    })

    if (!targetUser) {
      throw new Error("User not found")
    }

    // Create the order
    const order = await db.order.create({
      data: {
        userId: validatedData.userId,
        status: "CART",
        deliveryAddressId: validatedData.deliveryAddressId ?? undefined,
        notes: validatedData.notes ?? null,
      },
    })

    // Create order items
    const createdItems = await Promise.all(
      validatedData.items.map((item) =>
        db.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price ?? 0, // 0 means market price to be set later
          },
          include: {
            product: true,
          },
        })
      )
    )

    // If a new delivery address is provided, create it and link it to the order
    if (validatedData.deliveryAddress) {
      const address = await db.address.create({
        data: {
          userId: validatedData.userId,
          ...validatedData.deliveryAddress,
        },
      })

      await db.order.update({
        where: { id: order.id },
        data: { deliveryAddressId: address.id },
      })
    }

    revalidatePath("/admin/orders")

    // Return the complete order with items
    return {
      ...order,
      items: createdItems,
    }
  }
)
