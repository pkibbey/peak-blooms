import Hero, { type GradientPreset } from "@/components/site/Hero"

interface DeliveryBannerProps {
  subtitle?: string
  gradientPreset?: GradientPreset
}

export function DeliveryBanner({
  subtitle = "Free regional delivery on all orders. Our own delivery team ensures your flowers arrive fresh.",
  gradientPreset = "forest",
}: DeliveryBannerProps) {
  return (
    <Hero
      title="Free Delivery"
      subtitle={subtitle}
      textPosition="center"
      gradientPreset={gradientPreset}
    />
  )
}
