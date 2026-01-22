import { InferenceClient } from "@huggingface/inference"
import { generateVariedPrompt, type StyleTemplate } from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { wrapRoute } from "@/server/error-handler"

export const maxDuration = 300

export const POST = wrapRoute(async function POST(request: Request) {
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const body = await request.json()
  const { productId, styleTemplate } = body as {
    productId: string
    styleTemplate?: StyleTemplate
  }

  if (!productId) {
    throw new Error("Missing required field: productId")
  }

  const product = await db.product.findUnique({ where: { id: productId } })
  if (!product) {
    throw new Error("Product not found")
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
    throw new Error("Hugging Face API key not configured")
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
})
