import { InferenceClient } from "@huggingface/inference"
import {
  generateDescriptionPrompt,
  getDescriptionSystemPrompt,
  type ProductType,
} from "@/lib/ai-description-templates"
import { getSession } from "@/lib/auth"

export const maxDuration = 60 // Text generation is typically faster than image generation

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Generate Description API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productName, productType, existingDescription } = body as {
      productName: string
      productType: ProductType
      existingDescription?: string
    }

    if (!productName) {
      console.error("[Generate Description API] Missing required field: productName")
      return Response.json({ error: "Missing required field: productName" }, { status: 400 })
    }

    // Generate the prompt for the LLM
    const userPrompt = generateDescriptionPrompt(productName, productType, existingDescription)
    const systemPrompt = getDescriptionSystemPrompt()

    // Initialize Hugging Face Inference client
    const apiKey = process.env.HUGGINGFACE_API_KEY
    if (!apiKey) {
      console.error("[Generate Description API] HUGGINGFACE_API_KEY not configured")
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    const hf = new InferenceClient(apiKey)

    // Generate description using text generation
    const result = await hf.textGeneration({
      model: "mistralai/Mistral-7B-Instruct-v0.1",
      inputs: userPrompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
      },
      system_prompt: systemPrompt,
    })

    const generatedDescription = result.generated_text.trim()

    return Response.json({
      success: true,
      description: generatedDescription,
      productName,
      productType,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Generate Description API] Error:", errorMessage, err)
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
