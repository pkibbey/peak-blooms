import { z } from "zod"

// Delete blob schema
export const deleteBlobSchema = z.object({
  url: z.string().url("URL must be a valid URL"),
})

export type DeleteBlobInput = z.infer<typeof deleteBlobSchema>
