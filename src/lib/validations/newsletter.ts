import { z } from "zod"

export const newsletterSubscribeSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})

export type NewsletterSubscribeFormData = z.infer<typeof newsletterSubscribeSchema>
