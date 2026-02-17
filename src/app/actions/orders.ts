"use server"

import { revalidatePath } from "next/cache"
import { calculateMinimumTotal } from "@/lib/cart-utils"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"
import type { CancelOrderResponse, OrderWithItems } from "@/lib/query-types"
import { adjustPrice, makeFriendlyOrderId } from "@/lib/utils"
import {
  type AdminAddOrderItemsInput,
  type AdminCreateOrderInput,
  type AdminUpdateOrderItemQuantityInput,
  adminAddOrderItemsSchema,
  adminCreateOrderSchema,
  adminUpdateOrderItemQuantitySchema,
  type CancelOrderInput,
  type CreateOrderInput,
  cancelOrderSchema,
  createOrderSchema,
  type DeleteOrderAttachmentInput,
  // delete order (admin)
  type DeleteOrderInput,
  type DeleteOrderItemInput,
  deleteOrderAttachmentSchema,
  deleteOrderItemSchema,
  deleteOrderSchema,
  type GenerateInvoiceInput,
  // invoice schemas
  generateInvoiceSchema,
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

      // Include attachments for the response
      const attachments = await db.orderAttachment.findMany({ where: { orderId: updatedOrder.id } })

      revalidatePath("/cart")
      revalidatePath(`/account/order-history/${orderId}`)

      return {
        ...updatedOrder,
        items: order.items,
        attachments,
      }
    } else {
      // Simply transition to CANCELLED
      const cancelledOrder = await db.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
        },
      })

      // Include attachments for the response
      const attachments = await db.orderAttachment.findMany({
        where: { orderId: cancelledOrder.id },
      })

      revalidatePath(`/account/order-history/${orderId}`)
      revalidatePath("/account/order-history")

      return {
        ...cancelledOrder,
        items: order.items,
        attachments,
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
        attachments: true,
      },
    })

    const friendly = await makeFriendlyOrderId(user.id, cart.id, async (candidate) =>
      Boolean(await db.order.findUnique({ where: { friendlyId: candidate } }))
    )

    await db.order.update({
      where: { id: cart.id },
      data: {
        status: "PENDING",
        notes: notes || null,
        deliveryAddressId: finalDeliveryAddressId,
        // Persist the generated friendlyId
        friendlyId: friendly,
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
        attachments: true,
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

export const deleteOrderItemAction = wrapAction(
  async (input: DeleteOrderItemInput): Promise<{ id: string; orderTotal: number }> => {
    const { orderId, itemId } = deleteOrderItemSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to delete order items")
    }

    // Fetch the order item
    const orderItem = await db.orderItem.findFirst({ where: { id: itemId, orderId } })
    if (!orderItem) {
      throw new Error("Order item not found")
    }

    // Ensure parent order exists
    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new Error("Order not found")
    }
    // allow deleting individual order items regardless of order status

    // Delete the order item
    await db.orderItem.delete({ where: { id: itemId } })

    // Recalculate order total from remaining items
    const allItems = await db.orderItem.findMany({ where: { orderId } })
    const newOrderTotal = allItems.reduce((sum, item) => {
      if (item.price === 0) return sum
      return sum + (item.price ?? 0) * item.quantity
    }, 0)

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    if (order.status === "CART") revalidatePath("/cart")

    return {
      id: itemId,
      orderTotal: Math.round(newOrderTotal * 100) / 100,
    }
  }
)

/**
 * Admin: add one or more products to an existing order
 * - increments quantity if item already exists
 * - snapshots current product price using the order owner's priceMultiplier
 */
export const adminAddOrderItemsAction = wrapAction(async (input: AdminAddOrderItemsInput) => {
  const { orderId, items } = adminAddOrderItemsSchema.parse(input)
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: You must be an admin to add order items")
  }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) throw new Error("Order not found")

  // Determine price multiplier for the order owner (default to 1.0)
  const orderOwner = await db.user.findUnique({ where: { id: order.userId } })
  const multiplier = orderOwner?.priceMultiplier ?? 1.0

  // Process each requested product
  for (const it of items) {
    const product = await db.product.findUnique({ where: { id: it.productId } })
    if (!product) throw new Error(`Product not found: ${it.productId}`)

    const existing = await db.orderItem.findFirst({ where: { orderId, productId: product.id } })
    if (existing) {
      await db.orderItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + it.quantity },
      })
    } else {
      await db.orderItem.create({
        data: {
          orderId,
          productId: product.id,
          quantity: it.quantity,
          price: adjustPrice(product.price ?? 0, multiplier),
          productNameSnapshot: product.name,
          productImageSnapshot: product.images?.[0] ?? null,
        },
        include: { product: true },
      })
    }
  }

  const updatedOrder = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { include: { product: true } }, attachments: true },
  })

  revalidatePath("/admin/orders")
  revalidatePath(`/admin/orders/${orderId}`)
  if (order.status === "CART") revalidatePath("/cart")

  return updatedOrder
})

/**
 * Admin: update quantity for an order item (0 => delete)
 */
export const adminUpdateOrderItemQuantityAction = wrapAction(
  async (input: AdminUpdateOrderItemQuantityInput) => {
    const { orderId, itemId, quantity } = adminUpdateOrderItemQuantitySchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to update order item quantities")
    }

    const item = await db.orderItem.findUnique({ where: { id: itemId }, include: { order: true } })
    if (!item || item.orderId !== orderId) throw new Error("Order item not found")

    if (quantity <= 0) {
      await db.orderItem.delete({ where: { id: itemId } })
    } else {
      await db.orderItem.update({ where: { id: itemId }, data: { quantity } })
    }

    const updatedOrder = await db.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: { include: { product: true } }, attachments: true },
    })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)
    if (updatedOrder.status === "CART") revalidatePath("/cart")

    return updatedOrder
  }
)

export const deleteOrderAction = wrapAction(
  async (input: DeleteOrderInput): Promise<{ id: string }> => {
    const { orderId } = deleteOrderSchema.parse(input)
    const user = await getCurrentUser()

    if (!user || user.role !== "ADMIN") {
      throw new Error("Unauthorized: You must be an admin to delete orders")
    }

    const order = await db.order.findUnique({ where: { id: orderId } })
    if (!order) {
      throw new Error("Order not found")
    }

    // Prevent deleting orders that still have invoice attachments
    const existingInvoices = await db.orderAttachment.findMany({
      where: { orderId, mime: "application/pdf" },
      take: 1,
    })

    if ((existingInvoices || []).length > 0) {
      throw new Error(
        "Conflict: Order has active invoices attached — delete invoices before deleting the order"
      )
    }

    // Allow deleting orders regardless of status — invoices are checked above and will block deletion if present

    await db.order.delete({ where: { id: orderId } })

    revalidatePath("/admin/orders")
    revalidatePath(`/admin/orders/${orderId}`)

    return { id: orderId }
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
        friendlyId: "",
        deliveryAddressId: validatedData.deliveryAddressId ?? undefined,
        notes: validatedData.notes ?? null,
      },
    })

    // Persist friendlyId for admin-created orders (auto-retries handled by helper)
    const friendly = await makeFriendlyOrderId(validatedData.userId, order.id, async (candidate) =>
      Boolean(await db.order.findUnique({ where: { friendlyId: candidate } }))
    )

    await db.order.update({ where: { id: order.id }, data: { friendlyId: friendly } })

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
      attachments: [],
    }
  }
)

/**
 * Server action to generate an invoice PDF for an order and attach it to the order.
 * - Generates PDF with pdf-lib
 * - Uploads to Vercel Blob using @vercel/blob/client (handleUploadUrl: /api/upload)
 * - Persists an OrderAttachment record
 */
export const generateInvoiceAction = wrapAction(async (input: GenerateInvoiceInput) => {
  const { orderId } = generateInvoiceSchema.parse(input)
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: You must be an admin to generate invoices")
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      user: true,
      deliveryAddress: true,
    },
  })

  if (!order) throw new Error("Order not found")

  // Prevent invoice generation when any order item is market-priced (price === 0)
  const hasMarketPriceItems = (order.items || []).some((it) => it.price === 0)
  if (hasMarketPriceItems) {
    throw new Error(
      "Conflict: Order contains market-priced items — set prices for all items before generating an invoice."
    )
  }

  const { generateInvoicePdfBuffer } = await import("@/app/actions/pdf")
  const pdfBuffer = await generateInvoicePdfBuffer(order)

  // Upload to Vercel Blob using server-safe APIs (avoid client-only `upload` which uses `location`)
  const { generateClientTokenFromReadWriteToken, put } = await import("@vercel/blob/client")
  const timestamp = Date.now()
  const filename = `invoice_${order.friendlyId}_${timestamp}.pdf`
  const pathname = `generated/invoices/${filename}`

  // Generate a short-lived client token (server-side) and upload the PDF directly into generated/invoices!
  const clientToken = await generateClientTokenFromReadWriteToken({
    pathname,
    // allow PDF mime
    allowedContentTypes: ["application/pdf"],
  })

  const uploaded = await put(pathname, pdfBuffer, {
    access: "public",
    token: clientToken,
    contentType: "application/pdf",
  })

  // Persist attachment record (only rely on known/available values)
  const attachment = await db.orderAttachment.create({
    data: {
      orderId: order.id,
      url: uploaded.url,
      key: null,
      mime: "application/pdf",
      size: pdfBuffer.length,
    },
  })

  revalidatePath(`/admin/orders/${order.id}`)
  revalidatePath("/admin/orders")

  return attachment
})

/**
 * Server action to delete an order attachment (blob + DB record)
 */
export const deleteOrderAttachmentAction = wrapAction(async (input: DeleteOrderAttachmentInput) => {
  const { attachmentId } = deleteOrderAttachmentSchema.parse(input)
  const user = await getCurrentUser()

  if (!user || user.role !== "ADMIN") {
    throw new Error("Unauthorized: You must be an admin to delete attachments")
  }

  const attachment = await db.orderAttachment.findUnique({ where: { id: attachmentId } })
  if (!attachment) throw new Error("Attachment not found")

  // Attempt blob deletion (best-effort)
  try {
    if (attachment.url?.includes("blob.vercel-storage.com")) {
      const { deleteBlobAction } = await import("@/app/actions/blob")
      await deleteBlobAction({ url: attachment.url })
    }
  } catch (err) {
    // don't block deletion of DB record if blob delete failed
    console.warn("Failed to delete blob for attachment:", err)
  }

  await db.orderAttachment.delete({ where: { id: attachmentId } })

  revalidatePath(`/admin/orders/${attachment.orderId}`)
  revalidatePath("/admin/orders")

  return { id: attachmentId }
})
