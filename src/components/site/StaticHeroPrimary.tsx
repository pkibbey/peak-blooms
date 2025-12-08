import Hero from "@/components/site/Hero"

/**
 * Static Primary Hero - Slot 1 (Above Featured Collections)
 * Previously "Main Home Hero" in the database
 */
export default function StaticHeroPrimary() {
  return (
    <Hero
      title="Premium Wholesale Flowers for Creative Professionals"
      subtitle="Partner with Peak Blooms for the highest quality, freshest flowers. Competitive wholesale pricing, sustainable sourcing, and reliable local delivery—built for florists, retailers, and event planners."
      ctaText="Browse Catalog"
      ctaLink="/shop"
      backgroundImage="/hero-images/welcome.png"
      textPosition="left"
    />
  )
}
