/**
 * AI Prompt Templates for Image Generation
 * Each style template includes pools of keywords that are randomly selected
 * to inject variation into generated images while maintaining consistency
 */

export type StyleTemplate = "botanical" | "lifestyle" | "editorial" | "realistic"

interface PromptTemplate {
  name: string
  description: string
  basePrompt: (productName: string, productType: string) => string
  compositionVariations: string[]
  lightingVariations: string[]
  styleVariations: string[]
}

const PROMPT_TEMPLATES: Record<StyleTemplate, PromptTemplate> = {
  botanical: {
    name: "Botanical Close-up",
    description: "Detailed botanical photography with focus on form, texture, and natural details",
    basePrompt: (productName: string, productType: string) =>
      `A detailed botanical photograph of ONLY a ${productName} ${productType}. Must show exclusively this one ${productType} with no other flowers or plants visible. This must be specifically a ${productName} with its exact characteristics and appearance.`,
    compositionVariations: [
      "close-up macro shot",
      "full bloom detail",
      "petal texture focus",
      "center stamen detail",
      "layered petal arrangement",
    ],
    lightingVariations: [
      "soft natural diffused light",
      "bright studio lighting",
      "backlit with rim light",
      "golden hour warm light",
      "clean white background light",
    ],
    styleVariations: [
      "scientific botanical illustration style",
      "professional botanical photography",
      "detailed naturalism",
      "museum quality specimen",
      "high definition botanical catalog",
    ],
  },

  lifestyle: {
    name: "Garden Arrangement",
    description: "Natural garden or floral arrangement context with realistic settings",
    basePrompt: (productName: string, productType: string) =>
      `A beautiful arrangement featuring ONLY ${productName} ${productType} - no other flowers or plants mixed in. The arrangement must showcase exclusively this ${productType} variety, either held in a hand, in a vase, or displayed alone.`,
    compositionVariations: [
      "single stem arrangement",
      "full bouquet display",
      "in a vase arrangement",
      "garden bed context",
      "hand-held arrangement",
    ],
    lightingVariations: [
      "natural soft daylight",
      "golden hour sunlight",
      "overcast diffused light",
      "garden dappled shade",
      "bright morning light",
    ],
    styleVariations: [
      "professional florist photography",
      "lifestyle garden photography",
      "romantic garden aesthetic",
      "modern floral design",
      "cottage garden style",
    ],
  },

  editorial: {
    name: "Editorial Style",
    description: "High-end editorial and commercial photography with polished aesthetic",
    basePrompt: (productName: string, productType: string) =>
      `Professional editorial photograph featuring ONLY ${productName} ${productType}. Must show exclusively this one ${productType} variety with no other flowers or plants. This exact variety with its distinctive features, either held, arranged, or displayed solo.`,
    compositionVariations: [
      "centered composition",
      "artistic layered arrangement",
      "dramatic diagonal composition",
      "minimalist single specimen",
      "dynamic grouped arrangement",
    ],
    lightingVariations: [
      "dramatic studio lighting",
      "professional key and fill light",
      "editorial side lighting",
      "high contrast lighting",
      "soft overhead studio light",
    ],
    styleVariations: [
      "high-end editorial photography",
      "luxury flower photography",
      "commercial product photography",
      "fine art floral composition",
      "magazine cover quality",
    ],
  },

  realistic: {
    name: "Realistic Product",
    description:
      "Natural realistic photography with subtle backgrounds, natural petal variations, and consistent lighting",
    basePrompt: (productName: string, productType: string) =>
      `A realistic photograph of ONLY a ${productName} ${productType}. Must show exclusively this one ${productType} with no other flowers or plants visible. The ${productType} should have natural petal variations - not always fully open, with some petals slightly closed or folded. This must be specifically a ${productName} with its exact characteristics and realistic appearance.`,
    compositionVariations: [
      "natural full flower with varied petal opening",
      "slightly turned angle with some closed petals",
      "organic arrangement with relaxed petals",
      "realistic bloom at peak beauty with natural asymmetry",
      "detailed side profile with natural petal variation",
    ],
    lightingVariations: [
      "soft consistent daylight with natural shadows",
      "neutral studio lighting without harsh shadows",
      "gentle directional light with balanced exposure",
      "consistent even lighting across the flower",
      "soft window light with subtle shadows",
    ],
    styleVariations: [
      "realistic product photography without HDR",
      "natural professional flower photography",
      "realistic botanical product catalog",
      "natural lighting professional photo",
      "authentic product photography with true colors",
    ],
  },
}

/**
 * Generate a varied prompt for image generation by selecting random keywords
 * from each pool while maintaining the core style identity
 */
export function generateVariedPrompt(
  productName: string,
  productType: string,
  styleTemplate: StyleTemplate,
  description?: string
): string {
  const template = PROMPT_TEMPLATES[styleTemplate]

  // Randomly select one variation from each pool
  const composition =
    template.compositionVariations[
      Math.floor(Math.random() * template.compositionVariations.length)
    ]
  const lighting =
    template.lightingVariations[Math.floor(Math.random() * template.lightingVariations.length)]
  const style =
    template.styleVariations[Math.floor(Math.random() * template.styleVariations.length)]

  const basePrompt = template.basePrompt(productName, productType)

  // Include product description if provided
  const descriptionPart = description ? ` Details: ${description}.` : ""

  return `${basePrompt}, ${composition}, ${lighting}, ${style}.${descriptionPart} High quality, sharp focus, professional photography.`
}

/**
 * Get metadata about available style templates
 */
export function getAvailableTemplates(): Array<{
  id: StyleTemplate
  name: string
  description: string
}> {
  return [
    {
      id: "botanical",
      name: PROMPT_TEMPLATES.botanical.name,
      description: PROMPT_TEMPLATES.botanical.description,
    },
    {
      id: "lifestyle",
      name: PROMPT_TEMPLATES.lifestyle.name,
      description: PROMPT_TEMPLATES.lifestyle.description,
    },
    {
      id: "editorial",
      name: PROMPT_TEMPLATES.editorial.name,
      description: PROMPT_TEMPLATES.editorial.description,
    },
    {
      id: "realistic",
      name: PROMPT_TEMPLATES.realistic.name,
      description: PROMPT_TEMPLATES.realistic.description,
    },
  ]
}

/**
 * Pick the first style for two-image generation.
 * Randomly selects one of: editorial, botanical, or garden (mapped to 'lifestyle')
 */
export function pickRandomFirstStyle(): StyleTemplate {
  const pool: StyleTemplate[] = ["editorial", "botanical", "lifestyle"]
  return pool[Math.floor(Math.random() * pool.length)]
}
