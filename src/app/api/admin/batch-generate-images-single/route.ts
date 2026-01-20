import { InferenceClient } from "@huggingface/inference"
import {
  generateVariedPrompt,
  pickRandomFirstStyle,
  type StyleTemplate,
} from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const maxDuration = 300

interface SingleProductImageResult {
  success: boolean
  error?: string
  images?: Array<{ imageUrl: string; prompt: string; styleTemplate: StyleTemplate }>
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Auth check
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Batch Generate Images Single API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId } = body as { productId: string }

    if (!productId) {
      console.error("[Batch Generate Images Single API] Missing productId")
      return Response.json({ error: "Missing productId" }, { status: 400 })
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, productType: true, description: true },
    })

    if (!product) {
      console.error("[Batch Generate Images Single API] Product not found")
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      console.error("[Batch Generate Images Single API] HUGGINGFACE_API_KEY not configured")
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    console.info(
      `[Batch Generate Images Single API] Generating images for product: ${product.name} (${product.id})`
    )

    const images: Array<{ imageUrl: string; prompt: string; styleTemplate: StyleTemplate }> = []

    const hf = new InferenceClient(hfApiKey)

    // First image: random first style
    const firstStyle = pickRandomFirstStyle()
    const firstPrompt = generateVariedPrompt(
      product.name,
      product.productType as string,
      firstStyle,
      product.description || undefined
    )

    console.info(
      `[Batch Generate Images Single API] Generating first image with style: ${firstStyle}`
    )
    const firstBlob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: firstPrompt,
    })
    const firstArrayBuffer = await (firstBlob as unknown as Blob).arrayBuffer()
    const firstBase64 = Buffer.from(firstArrayBuffer).toString("base64")
    const firstDataUrl = `data:image/jpeg;base64,${firstBase64}`

    images.push({ imageUrl: firstDataUrl, prompt: firstPrompt, styleTemplate: firstStyle })

    // Second image: realistic
    const secondStyle: StyleTemplate = "realistic"
    const secondPrompt = generateVariedPrompt(
      product.name,
      product.productType as string,
      secondStyle,
      product.description || undefined
    )

    console.info("[Batch Generate Images Single API] Generating second image with style: realistic")
    const secondBlob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: secondPrompt,
    })
    const secondArrayBuffer = await (secondBlob as unknown as Blob).arrayBuffer()
    const secondBase64 = Buffer.from(secondArrayBuffer).toString("base64")
    const secondDataUrl = `data:image/jpeg;base64,${secondBase64}`

    images.push({ imageUrl: secondDataUrl, prompt: secondPrompt, styleTemplate: secondStyle })

    console.info(
      `[Batch Generate Images Single API] Successfully generated images for ${product.name}`
    )

    const result: SingleProductImageResult = {
      success: true,
      images,
    }

    return Response.json(result)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Batch Generate Images Single API] Error:", err)
    return Response.json({ error: `Error: ${errorMessage}` }, { status: 500 })
  }
}
