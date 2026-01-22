import { generateDescriptionPrompt, type ProductType } from "@/lib/ai-description-templates"
import { getSession } from "@/lib/auth"
import { wrapRoute } from "@/server/error-handler"

export const maxDuration = 60

export const POST = wrapRoute(async function POST(request: Request) {
  // Check authentication
  const session = await getSession()
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { productName, productType, existingDescription } = body as {
    productName: string
    productType: ProductType
    existingDescription?: string
  }

  if (!productName) {
    return Response.json({ error: "Missing required field: productName" }, { status: 400 })
  }

  // Check that Hugging Face API key is configured
  const hfApiKey = process.env.HUGGINGFACE_API_KEY
  if (!hfApiKey) {
    return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
  }

  // Generate the prompt for the LLM
  const userPrompt = generateDescriptionPrompt(productName, productType, existingDescription)

  const model = "Qwen/Qwen2.5-Coder-3B-Instruct"
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
    return Response.json({ error: `Hugging Face error: ${errorText}` }, { status: 500 })
  }

  const hfJson = await hfResp.json()
  const generated = (hfJson.choices?.[0]?.message?.content ?? "").toString().trim()

  if (!generated) {
    return Response.json({ error: "Hugging Face generated empty response" }, { status: 500 })
  }

  return Response.json({
    success: true,
    description: generated,
    productName,
    productType,
    model,
  })
})
