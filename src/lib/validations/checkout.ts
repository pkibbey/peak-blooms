import { z } from "zod"
import { addressSchema } from "./address"

export const checkoutSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  notes: z.string(),
  selectedAddressId: z.string(),
  deliveryAddress: addressSchema,
  saveDeliveryAddress: z.boolean(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

// Schema for the API request (slightly different structure)
// Phone is now part of deliveryAddress, not a separate field
export const createOrderSchema = z.object({
  deliveryAddressId: z.string().nullable(),
  deliveryAddress: addressSchema.nullable(),
  saveDeliveryAddress: z.boolean().optional(),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  notes: z.string().nullable(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
