import { generateDescriptionPrompt, type ProductType } from "@/lib/ai-description-templates"
import { db } from "@/lib/db"
import { toAppError } from "@/lib/error-utils"

export const maxDuration = 300

interface BatchGenerateResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failureCount: number
  details: Array<{
    productId: string
    productName: string
    success: boolean
    error?: string
  }>
}

export async function POST(request: Request): Promise<Response> {
  try {
    // Parse query params for filters
    const url = new URL(request.url)
    const filterDescription = url.searchParams.get("filterDescription") as "has" | "missing" | null
    const filterImages = url.searchParams.get("filterImages") as "has" | "missing" | null
    const typesParam = url.searchParams.get("types")
    const types = typesParam ? typesParam.split(",").filter(Boolean) : null
    const productType = url.searchParams.get("productType")

    // Check that Hugging Face API key is configured
    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    // Build the where clause with filters
    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    }

    // Apply description filter (default to missing if not specified)
    if (filterDescription === "has") {
      whereClause.AND = [{ description: { not: null } }, { description: { not: "" } }]
    } else {
      // Default: filter for missing descriptions
      whereClause.OR = [{ description: null }, { description: "" }]
    }

    // Apply image filter
    if (filterImages === "has") {
      whereClause.images = { isEmpty: false }
    } else if (filterImages === "missing") {
      whereClause.images = { isEmpty: true }
    }

    // Filter by specific product type(s)
    const ProductTypeEnum = require("@/generated/client").ProductType
    if (types && types.length > 0) {
      whereClause.productType = {
        in: types.map((t) => ProductTypeEnum[t as keyof typeof ProductTypeEnum]),
      }
    } else if (productType) {
      whereClause.productType = ProductTypeEnum[productType as keyof typeof ProductTypeEnum]
    }

    // Fetch up to 10 products without descriptions (null or empty string)
    const productsToProcess = await db.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        productType: true,
      },
      orderBy: {
        name: "asc",
      },
      take: 10,
    })

    const result: BatchGenerateResult = {
      success: true,
      totalProcessed: productsToProcess.length,
      successCount: 0,
      failureCount: 0,
      details: [],
    }

    // Process each product sequentially
    for (const product of productsToProcess) {
      try {
        // Generate the prompt for the LLM
        const userPrompt = generateDescriptionPrompt(
          product.name,
          product.productType as ProductType
        )

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
          const errorMessage = `Hugging Face error: ${hfResp.status}`
          result.failureCount++
          result.details.push({
            productId: product.id,
            productName: product.name,
            success: false,
            error: errorMessage,
          })
          continue
        }

        const hfJson = await hfResp.json()
        const generated = (hfJson.choices?.[0]?.message?.content ?? "").toString().trim()

        if (!generated) {
          const errorMessage = "Hugging Face generated empty response"
          result.failureCount++
          result.details.push({
            productId: product.id,
            productName: product.name,
            success: false,
            error: errorMessage,
          })
          continue
        }

        // Update the product with the generated description
        await db.product.update({
          where: { id: product.id },
          data: { description: generated },
        })

        result.successCount++
        result.details.push({
          productId: product.id,
          productName: product.name,
          success: true,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        result.failureCount++
        result.details.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: errorMessage,
        })
      }
    }

    return Response.json(result)
  } catch (err) {
    const error = toAppError(err, "Batch Generate Descriptions failed")
    return Response.json({ error }, { status: 500 })
  }
}
