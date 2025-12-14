import { z } from "zod"

// Profile schema - email is read-only (from Google), only name can be updated
export const profileSchema = z.object({
  name: z.string(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
