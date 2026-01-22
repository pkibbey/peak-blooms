import { InferenceClient } from "@huggingface/inference"
import {
  generateVariedPrompt,
  pickRandomFirstStyle,
  type StyleTemplate,
} from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"

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
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId } = body as { productId: string }

    if (!productId) {
      return Response.json({ error: "Missing productId" }, { status: 400 })
    }

    const product = await db.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, productType: true, description: true },
    })

    if (!product) {
      return Response.json({ error: "Product not found" }, { status: 404 })
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

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

    const secondBlob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: secondPrompt,
    })
    const secondArrayBuffer = await (secondBlob as unknown as Blob).arrayBuffer()
    const secondBase64 = Buffer.from(secondArrayBuffer).toString("base64")
    const secondDataUrl = `data:image/jpeg;base64,${secondBase64}`

    images.push({ imageUrl: secondDataUrl, prompt: secondPrompt, styleTemplate: secondStyle })

    const result: SingleProductImageResult = {
      success: true,
      images,
    }

    return Response.json(result)
  } catch (err) {
    const error = toAppError(err, "Batch Generate Images Single failed")
    return Response.json({ error }, { status: 500 })
  }
}
