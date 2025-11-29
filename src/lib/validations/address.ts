import { z } from "zod"

export const addressSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().min(1, "Company name is required"),
  street1: z.string().min(1, "Street address is required"),
  street2: z.string(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z.string().min(1, "ZIP code is required"),
  country: z.string(),
})

export type AddressFormData = z.infer<typeof addressSchema>

export const emptyAddress: AddressFormData = {
  firstName: "",
  lastName: "",
  company: "",
  street1: "",
  street2: "",
  city: "",
  state: "",
  zip: "",
  country: "US",
}
