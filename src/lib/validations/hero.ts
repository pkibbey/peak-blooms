import { z } from "zod"

// Known internal routes for CTA links
export const VALID_CTA_ROUTES = [
  "/shop",
  "/collections",
  "/inspirations",
  "/cart",
  "/account",
] as const

// Gradient preset options with display info
export const GRADIENT_PRESETS = [
  { value: "slate-green", label: "Slate Green", colors: ["rgb(78, 102, 91)", "rgb(45, 47, 56)"] },
  { value: "forest", label: "Forest", colors: ["rgb(34, 87, 76)", "rgb(22, 44, 43)"] },
  { value: "rose", label: "Dusty Rose", colors: ["rgb(136, 84, 100)", "rgb(71, 48, 56)"] },
  { value: "ocean", label: "Ocean", colors: ["rgb(70, 95, 117)", "rgb(40, 48, 58)"] },
  { value: "earth", label: "Earth", colors: ["rgb(139, 90, 67)", "rgb(66, 49, 42)"] },
] as const

export type GradientPreset = (typeof GRADIENT_PRESETS)[number]["value"]

export const heroSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    slug: z.string().min(1, "Slug is required"),
    title: z.string().min(1, "Title is required"),
    subtitle: z.string().min(1, "Subtitle is required"),
    ctaText: z.string().optional(),
    ctaLink: z
      .string()
      .optional()
      .refine(
        (val) => {
          // allow blank
          if (!val) return true

          // Accept the base route ("/shop"), nested paths ("/shop/collections") and
          // query parameters ("/shop?utm=..." or "/shop/collections?ref=...").
          return VALID_CTA_ROUTES.some((route) => {
            return val === route || val.startsWith(`${route}/`) || val.startsWith(`${route}?`)
          })
        },
        {
          message: `CTA link must start with one of: ${VALID_CTA_ROUTES.join(", ")}`,
        }
      ),
    // New option to control where the hero text is placed on the banner
    textPosition: z.enum(["left", "center", "right"]).optional(),
    backgroundType: z.enum(["IMAGE", "GRADIENT"]),
    backgroundImage: z.string().optional(),
    gradientPreset: z.string().optional(),
    slotPosition: z.number().min(1).max(3).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.backgroundType === "IMAGE") {
        return !!data.backgroundImage
      }
      return true
    },
    {
      message: "Background image is required when using image background",
      path: ["backgroundImage"],
    }
  )
  .refine(
    (data) => {
      if (data.backgroundType === "GRADIENT") {
        return !!data.gradientPreset
      }
      return true
    },
    {
      message: "Gradient preset is required when using gradient background",
      path: ["gradientPreset"],
    }
  )

export type HeroFormData = z.infer<typeof heroSchema>

// Schema for API request
export const createHeroSchema = heroSchema

export type CreateHeroInput = z.infer<typeof createHeroSchema>
