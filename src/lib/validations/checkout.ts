import { z } from "zod"
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
