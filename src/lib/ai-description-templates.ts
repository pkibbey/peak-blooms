/**
 * Generates prompts for AI-powered product descriptions
 * Focuses on visual characteristics of flowers and plants
 */

export type ProductType = "FLOWER" | "ROSE" | "FILLER" | "FOLIAGE" | "PLANT"

const SYSTEM_PROMPT = `You are a knowledgeable florist and horticulturist. Write accurate, vivid visual descriptions of flowers and plants.
Focus on: bloom color and color variations, form and shape, petal characteristics, texture, fragrance (if notable), and practical qualities like cut-flower longevity or seasonal availability.
Keep descriptions to 1-2 sentences maximum.`

const PRODUCT_TYPE_CONTEXT: Record<ProductType, string> = {
  FLOWER: "Cut flower",
  ROSE: "Rose variety",
  FILLER: "Filler flower",
  FOLIAGE: "Foliage plant",
  PLANT: "Potted plant or specimen",
}

/**
 * Generates a user prompt for AI to create a product description
 * @param productName - The name/variety of the flower or plant
 * @param productType - The type of product (FLOWER, ROSE, FILLER, FOLIAGE, PLANT)
 * @param existingDescription - Optional existing description to improve/enhance
 * @returns The formatted user prompt
 */
export function generateDescriptionPrompt(
  productName: string,
  productType: ProductType = "FLOWER",
  existingDescription?: string
): string {
  const typeContext = PRODUCT_TYPE_CONTEXT[productType] || "Cut flower"

  if (existingDescription) {
    return `Write a visual description of the ${typeContext} "${productName}". Enhance or improve this existing description: "${existingDescription}". Focus on visual appearance: colors, blooms, form, and distinctive characteristics.`
  }

  return `Write a visual description of the ${typeContext} "${productName}". Focus on colors, bloom characteristics, form, size, petal texture, and any other distinctive visual qualities. Include fragrance if it's notably fragrant.`
}

/**
 * Gets the system prompt for description generation
 * @returns The system prompt that instructs the AI
 */
export function getDescriptionSystemPrompt(): string {
  return SYSTEM_PROMPT
}
