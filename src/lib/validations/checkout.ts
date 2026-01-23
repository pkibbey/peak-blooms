import { z } from "zod"
import { OrderStatus } from "@/generated/enums"
import { addressSchema } from "./address"

export const checkoutSchema = z.object({
  notes: z.string(),
  selectedAddressId: z.string(),
  deliveryAddress: addressSchema,
  saveDeliveryAddress: z.boolean(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

// Schema for the API request (slightly different structure)
// Email and phone are now part of deliveryAddress, not separate fields
export const createOrderSchema = z.object({
  deliveryAddressId: z.string().nullable(),
  deliveryAddress: addressSchema.nullable(),
  saveDeliveryAddress: z.boolean().optional(),
  notes: z.string().nullable(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
// Cart operation schemas
export const addToCartSchema = z.object({
  productId: z.string().min(1, "Invalid product ID"),
  quantity: z.number().int().min(1).max(999).default(1),
})

export type AddToCartInput = z.infer<typeof addToCartSchema>

export const updateCartItemSchema = z.object({
  itemId: z.string().min(1, "Invalid item ID"),
  quantity: z.number().int().min(0).max(999),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>

export const removeFromCartSchema = z.object({
  itemId: z.string().min(1, "Invalid item ID"),
})

export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>

export const batchAddToCartSchema = z
  .object({
    productIds: z
      .array(z.string().min(1, "Invalid product ID"))
      .min(1, "At least one product is required"),
    quantities: z
      .union([z.number().int().min(1).max(999), z.array(z.number().int().min(1).max(999))])
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.quantities || !Array.isArray(data.quantities)) return true
      return data.quantities.length === data.productIds.length
    },
    {
      message: "Invalid product data",
      path: ["quantities"],
    }
  )

export type BatchAddToCartInput = z.infer<typeof batchAddToCartSchema>

// Order operation schemas
export const cancelOrderSchema = z.object({
  orderId: z.uuid("Invalid order ID"),
  convertToCart: z.boolean().optional(),
})

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>

export const updateOrderStatusSchema = z.object({
  orderId: z.uuid("Invalid order ID"),
  status: z.enum(OrderStatus),
})

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>

export const updateOrderItemPriceSchema = z.object({
  orderId: z.uuid("Invalid order ID"),
  itemId: z.uuid("Invalid item ID"),
  price: z.number().nonnegative("Price must be non-negative"),
})

export type UpdateOrderItemPriceInput = z.infer<typeof updateOrderItemPriceSchema>
// Admin create order schema - for admins to manually create orders
export const adminCreateOrderSchema = z.object({
  userId: z.string().min(1, "User is required"),
  deliveryAddressId: z.string().nullable(),
  deliveryAddress: addressSchema.nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().int().min(1, "Quantity must be at least 1"),
        price: z.number().nonnegative("Price must be non-negative").optional(),
      })
    )
    .min(1, "At least one item is required"),
  notes: z.string().nullable().optional(),
})

export type AdminCreateOrderInput = z.infer<typeof adminCreateOrderSchema>
