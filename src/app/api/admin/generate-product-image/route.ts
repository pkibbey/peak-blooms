import { InferenceClient } from "@huggingface/inference"
import { generateVariedPrompt, type StyleTemplate } from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const maxDuration = 300

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Generate Product Image API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, styleTemplate } = body as {
      productId: string
      styleTemplate?: StyleTemplate
    }

    if (!productId) {
      console.error("[Generate Product Image API] Missing required field: productId")
      return Response.json({ error: "Missing required field: productId" }, { status: 400 })
    }

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      console.error("[Generate Product Image API] Product not found")
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const template: StyleTemplate = styleTemplate || "botanical"

    // Build prompt using the centralized utility
    const prompt = generateVariedPrompt(
      product.name,
      product.productType as string,
      template,
      product.description || undefined
    )

    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      console.error("[Generate Product Image API] HUGGINGFACE_API_KEY not configured")
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    const hf = new InferenceClient(apiKey)

    const imageBlob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
    })

    const arrayBuffer = await (imageBlob as unknown as Blob).arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")
    const imageUrl = `data:image/jpeg;base64,${base64Image}`

    return Response.json({ success: true, imageUrl, prompt, styleTemplate: template })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Generate Product Image API] Error:", errorMessage, err)
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
