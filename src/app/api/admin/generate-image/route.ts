import { InferenceClient } from "@huggingface/inference"
import { generateVariedPrompt, type StyleTemplate } from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { toAppError } from "@/lib/error-utils"

export const maxDuration = 300 // Image generation can take time

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productName, productType, styleTemplate, description } = body as {
      productName: string
      productType: string
      styleTemplate: StyleTemplate
      description?: string
    }

    if (!productName || !styleTemplate) {
      return Response.json(
        { error: "Missing required fields: productName, styleTemplate" },
        { status: 400 }
      )
    }

    // Generate a varied prompt
    const prompt = generateVariedPrompt(productName, productType, styleTemplate, description)

    // Initialize Hugging Face Inference client
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
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
  } catch (err) {
    const error = toAppError(err, "Generate Image failed")
    return Response.json({ error }, { status: 500 })
  }
}
