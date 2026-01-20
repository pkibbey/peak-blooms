import { generateDescriptionPrompt, type ProductType } from "@/lib/ai-description-templates"
import { getSession } from "@/lib/auth"

export const maxDuration = 60

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

    // Check that Hugging Face API key is configured
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      console.error("[Generate Description API] HUGGINGFACE_API_KEY not configured")
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    // Generate the prompt for the LLM
    const userPrompt = generateDescriptionPrompt(productName, productType, existingDescription)

    const model = "Qwen/Qwen2.5-Coder-3B-Instruct"
    try {
      console.info(`[Generate Description API] Calling ${model} via Hugging Face Inference Router`)
      const hfEndpoint = "https://router.huggingface.co/v1/chat/completions"
      const hfResp = await fetch(hfEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: userPrompt }],
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!hfResp.ok) {
        const errorText = await hfResp.text()
        console.error(
          `[Generate Description API] Hugging Face returned ${hfResp.status}:`,
          errorText
        )
        return Response.json({ error: `Hugging Face error: ${hfResp.status}` }, { status: 500 })
      }

      const hfJson = await hfResp.json()
      const generated = (hfJson.choices?.[0]?.message?.content ?? "").toString().trim()

      if (!generated) {
        console.error("[Generate Description API] Hugging Face returned no generated text", hfJson)
        return Response.json({ error: "Hugging Face generated empty response" }, { status: 500 })
      }

      return Response.json({
        success: true,
        description: generated,
        productName,
        productType,
        model,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[Generate Description API] Error:", errorMessage, err)
      return Response.json({ error: errorMessage }, { status: 500 })
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Generate Description API] Outer error:", errorMessage, err)
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
