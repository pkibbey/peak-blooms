import Hero, { type GradientPreset } from "@/components/site/Hero"

interface ShippingBannerProps {
  subtitle?: string
  gradientPreset?: GradientPreset
}

export function ShippingBanner({
  subtitle = "Free regional delivery on all orders. Our own delivery team ensures your flowers arrive fresh.",
  gradientPreset = "forest",
}: ShippingBannerProps) {
  return (
    <Hero
      title="Free Shipping"
      subtitle={subtitle}
      textPosition="center"
      gradientPreset={gradientPreset}
    />
  )
}
