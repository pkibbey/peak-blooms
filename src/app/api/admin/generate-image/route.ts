import { HfInference } from "@huggingface/inference"
import { generateVariedPrompt, type StyleTemplate } from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"

export const maxDuration = 300 // Image generation can take time

export async function POST(request: Request) {
  console.log("[Generate Image API] Request received")
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Generate Image API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Generate Image API] User authenticated:", session.user.email)

    const body = await request.json()
    const { productName, productType, styleTemplate, description } = body as {
      productName: string
      productType: string
      styleTemplate: StyleTemplate
      description?: string
    }

    console.log("[Generate Image API] Generating with params:", {
      productName,
      productType,
      styleTemplate,
      hasDescription: !!description,
    })

    if (!productName || !styleTemplate) {
      console.error("[Generate Image API] Missing required fields")
      return Response.json(
        { error: "Missing required fields: productName, styleTemplate" },
        { status: 400 }
      )
    }

    // Generate a varied prompt
    const prompt = generateVariedPrompt(productName, productType, styleTemplate, description)
    console.log("[Generate Image API] Generated prompt, length:", prompt.length)

    // Initialize Hugging Face Inference client
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      console.error("[Generate Image API] HUGGINGFACE_API_KEY not configured")
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    console.log(
      "[Generate Image API] Calling Hugging Face with model: black-forest-labs/FLUX.1-schnell"
    )
    const hf = new HfInference(apiKey)

    // Generate image using text to image
    const imageBlob = await hf.textToImage({
      model: "black-forest-labs/FLUX.1-schnell",
      inputs: prompt,
    })

    console.log(
      "[Generate Image API] Image generated, blob type:",
      (imageBlob as unknown as Blob).type
    )

    // Convert blob to base64
    const arrayBuffer = await (imageBlob as unknown as Blob).arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString("base64")
    const imageUrl = `data:image/jpeg;base64,${base64Image}`

    console.log("[Generate Image API] Base64 data URL created, length:", imageUrl.length)

    return Response.json({
      success: true,
      imageUrl,
      prompt,
      styleTemplate,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Generate Image API] Error:", errorMessage, err)
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
