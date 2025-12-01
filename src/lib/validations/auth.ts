import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})

export type SignInFormData = z.infer<typeof signInSchema>

export const signUpSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
})

export type SignUpFormData = z.infer<typeof signUpSchema>

export const profileSchema = z.object({
  name: z.string(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
