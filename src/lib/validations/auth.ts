import { z } from "zod"
import { isValidPhoneNumber } from "@/lib/phone"

// Profile schema - email is read-only (from Google), only name and phone can be updated
export const profileSchema = z.object({
  name: z.string(),
  phone: z
    .string()
    .optional()
    .refine((value) => !value || isValidPhoneNumber(value), "Please enter a valid phone number"),
})

export type ProfileFormData = z.infer<typeof profileSchema>
