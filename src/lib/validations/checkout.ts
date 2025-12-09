import { z } from "zod"
import { addressSchema } from "./address"

export const checkoutSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z.string(),
  notes: z.string(),
  selectedAddressId: z.string(),
  shippingAddress: addressSchema,
  saveShippingAddress: z.boolean(),
})

export type CheckoutFormData = z.infer<typeof checkoutSchema>

// Schema for the API request (slightly different structure)
export const createOrderSchema = z.object({
  shippingAddressId: z.string().nullable(),
  shippingAddress: addressSchema.nullable(),
  saveShippingAddress: z.boolean().optional(),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  phone: z.string().nullable(),
  notes: z.string().nullable(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
