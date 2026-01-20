import { InferenceClient } from "@huggingface/inference"
import {
  generateVariedPrompt,
  pickRandomFirstStyle,
  type StyleTemplate,
} from "@/lib/ai-prompt-templates"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"

export const maxDuration = 300

interface BatchGenerateImagesResult {
  success: boolean
  totalProcessed: number
  successCount: number
  failureCount: number
  details: Array<{
    productId: string
    productName: string
    success: boolean
    error?: string
    images?: Array<{ imageUrl: string; prompt: string; styleTemplate: StyleTemplate }>
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

    // Auth check
    const session = await getSession()
    if (!session?.user || session.user.role !== "ADMIN") {
      console.error("[Batch Generate Images API] Unauthorized - no session or not admin")
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY
    if (!hfApiKey) {
      console.error("[Batch Generate Images API] HUGGINGFACE_API_KEY not configured")
      return Response.json({ error: "Hugging Face API key not configured" }, { status: 500 })
    }

    // Build where clause similar to descriptions batching
    const whereClause: Record<string, unknown> = {
      deletedAt: null,
    }

    // For images, default to missing
    if (filterImages === "has") {
      whereClause.images = { isEmpty: false }
    } else {
      whereClause.images = { isEmpty: true }
    }

    // Apply description filter if provided
    if (filterDescription === "has") {
      whereClause.AND = [{ description: { not: null } }, { description: { not: "" } }]
    } else if (filterDescription === "missing") {
      whereClause.OR = [{ description: null }, { description: "" }]
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

    console.info("[Batch Generate Images API] Fetching next 10 products without images")
    const productsToProcess = await db.product.findMany({
      where: whereClause,
      select: { id: true, name: true, productType: true, description: true },
      orderBy: { name: "asc" },
      take: 10,
    })

    console.info(`[Batch Generate Images API] Processing ${productsToProcess.length} products`)

    const result: BatchGenerateImagesResult = {
      success: true,
      totalProcessed: productsToProcess.length,
      successCount: 0,
      failureCount: 0,
      details: [],
    }

    const hf = new InferenceClient(hfApiKey)

    for (const product of productsToProcess) {
      try {
        console.info(
          `[Batch Generate Images API] Processing product: ${product.name} (${product.id})`
        )

        const images: Array<{ imageUrl: string; prompt: string; styleTemplate: StyleTemplate }> = []

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

        result.successCount++
        result.details.push({
          productId: product.id,
          productName: product.name,
          success: true,
          images,
        })

        console.info(
          `[Batch Generate Images API] Successfully generated images for ${product.name}`
        )
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        console.error(`[Batch Generate Images API] Error processing ${product.name}:`, err)
        result.failureCount++
        result.details.push({
          productId: product.id,
          productName: product.name,
          success: false,
          error: errorMessage,
        })
      }
    }

    console.info(
      `[Batch Generate Images API] Batch complete: ${result.successCount}/${result.totalProcessed} successful`
    )

    return Response.json(result)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[Batch Generate Images API] Unexpected error:", err)
    return Response.json({ error: `Unexpected error: ${errorMessage}` }, { status: 500 })
  }
}
