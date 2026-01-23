import Hero from "@/components/site/Hero"

/**
 * Static Boxlots Hero - Slot 2 (Between Featured Sections)
 * Previously "Boxlot CTA" in the database
 */
export default function StaticHeroBoxlots() {
  return (
    <Hero
      title="Bulk Solutions for Large-Scale Success"
      subtitle="Access premium boxlots at wholesale pricing. Perfect for weddings, installations, and events—quality you trust, pricing that works, service that partners with your vision."
      ctaText="Explore Boxlots"
      ctaLink="/shop?productType=ROSE"
      backgroundImage="/hero-images/boxlots.png"
      textPosition="right"
    />
  )
}
