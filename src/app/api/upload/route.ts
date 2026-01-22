import { type HandleUploadBody, handleUpload } from "@vercel/blob/client"
import { getSession } from "@/lib/auth"
import { wrapRoute } from "@/server/error-handler"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export const POST = wrapRoute(async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async (_pathname, clientPayload) => {
      // Authenticate the user - only admins can upload
      const session = await getSession()

      if (!session?.user) {
        throw new Error("Not authenticated")
      }

      if (session.user.role !== "ADMIN") {
        throw new Error("Not authorized - admin access required")
      }

      // Parse client payload for folder, slug, extension, and unique filename flag
      const payload = clientPayload ? JSON.parse(clientPayload) : {}
      const { folder = "general", slug, extension = "jpg", unique = false, filename } = payload

      if (!slug && !filename) {
        throw new Error("Slug is required for upload")
      }

      const finalPath = filename ? filename : `${folder}/${slug}.${extension}`

      return {
        allowedContentTypes: ALLOWED_CONTENT_TYPES,
        maximumSizeInBytes: MAX_FILE_SIZE,
        addRandomSuffix: !!unique,
        allowOverwrite: !unique,
        pathname: finalPath,
        tokenPayload: JSON.stringify({
          userId: session.user.id,
        }),
      }
    },
  })

  return Response.json(jsonResponse)
})
