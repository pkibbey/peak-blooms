import { InferenceClient } from "@huggingface/inference"
import { generateVariedPrompt, type StyleTemplate } from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { wrapRoute } from "@/server/error-handler"

export const maxDuration = 300 // Image generation can take time

export const POST = wrapRoute(async function POST(request: Request) {
  // Check authentication
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const body = await request.json()
  const { productName, productType, styleTemplate, description } = body as {
    productName: string
    productType: string
    styleTemplate: StyleTemplate
    description?: string
  }

  if (!productName || !styleTemplate) {
    throw new Error("Missing required fields: productName, styleTemplate")
  }

  // Generate a varied prompt
  const prompt = generateVariedPrompt(productName, productType, styleTemplate, description)

  // Initialize Hugging Face Inference client
  const apiKey = process.env.HUGGINGFACE_API_KEY
  if (!apiKey) {
    throw new Error("Hugging Face API key not configured")
  }

  const hf = new InferenceClient(apiKey)

  // Generate image using text to image
  const imageBlob = await hf.textToImage({
    model: "black-forest-labs/FLUX.1-schnell",
    inputs: prompt,
  })

  // Convert blob to base64
  const arrayBuffer = await (imageBlob as unknown as Blob).arrayBuffer()
  const base64Image = Buffer.from(arrayBuffer).toString("base64")
  const imageUrl = `data:image/jpeg;base64,${base64Image}`

  return Response.json({
    success: true,
    imageUrl,
    prompt,
    styleTemplate,
  })
})
