import { type HandleUploadBody, handleUpload } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request): Promise<NextResponse> {
  console.log("[Upload API] Request received")
  const body = (await request.json()) as HandleUploadBody

  try {
    console.log("[Upload API] Processing upload request")
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        console.log("[Upload API] onBeforeGenerateToken - pathname:", _pathname)
        console.log("[Upload API] onBeforeGenerateToken - clientPayload:", clientPayload)

        // Authenticate the user - only admins can upload
        const session = await getSession()

        if (!session?.user) {
          console.error("[Upload API] No session found")
          throw new Error("Not authenticated")
        }

        console.log(
          "[Upload API] User authenticated:",
          session.user.email,
          "role:",
          session.user.role
        )

        if (session.user.role !== "ADMIN") {
          console.error("[Upload API] User is not admin, role:", session.user.role)
          throw new Error("Not authorized - admin access required")
        }

        // Parse client payload for folder, slug, and extension
        const payload = clientPayload ? JSON.parse(clientPayload) : {}
        const { folder = "general", slug, extension = "jpg" } = payload

        console.log("[Upload API] Parsed payload:", { folder, slug, extension })

        if (!slug) {
          console.error("[Upload API] No slug provided")
          throw new Error("Slug is required for upload")
        }

        const finalPath = `${folder}/${slug}.${extension}`
        console.log("[Upload API] Final pathname:", finalPath)

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_FILE_SIZE,
          addRandomSuffix: false,
          allowOverwrite: true,
          pathname: finalPath,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
          }),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This callback is called after the file has been uploaded to Vercel Blob
        console.log("[Upload API] Upload completed successfully, URL:", blob.url)

        if (tokenPayload) {
          const payload = JSON.parse(tokenPayload)
          console.log("[Upload API] Uploaded by user:", payload.userId)
        }
      },
    })

    console.log("[Upload API] Upload request processed successfully")
    return NextResponse.json(jsonResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed"
    console.error("[Upload API] Error:", message, error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
