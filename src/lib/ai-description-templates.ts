/**
 * Generates prompts for AI-powered product descriptions
 * Focuses on visual characteristics of flowers and plants
 */

export type ProductType = "FLOWER" | "ROSE" | "FILLER" | "FOLIAGE" | "PLANT"

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
    return `Concise visual description of the ${typeContext} "${productName}": ${existingDescription}. Refine to focus on color, form, and visual distinctiveness in 100 words as plain text.`
  }

  return `Describe the ${typeContext} "${productName}" visually in up to 100 words as plain text: color, bloom form, and distinctive characteristics.`
}
