import { type HandleUploadBody, handleUpload } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        // Authenticate the user - only admins can upload
        const session = await auth()

        if (!session?.user) {
          throw new Error("Not authenticated")
        }

        if (session.user.role !== "ADMIN") {
          throw new Error("Not authorized - admin access required")
        }

        // Parse client payload for folder, slug, and extension
        const payload = clientPayload ? JSON.parse(clientPayload) : {}
        const { folder = "general", slug, extension = "jpg" } = payload

        if (!slug) {
          throw new Error("Slug is required for upload")
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: true,
          pathname: `${folder}/${slug}.${extension}`,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called after the file has been uploaded to Vercel Blob
        console.log("Upload completed:", blob.url)

        if (tokenPayload) {
          const payload = JSON.parse(tokenPayload)
          console.log("Uploaded by user:", payload.userId)
        }
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
