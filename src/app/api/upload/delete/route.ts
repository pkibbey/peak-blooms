import { del } from "@vercel/blob"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 })
    }

    // Only delete blobs from our blob store
    if (!url.includes("blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid blob URL" }, { status: 400 })
    }

    await del(url)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete blob:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
