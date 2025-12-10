import Hero from "@/components/site/Hero"

/**
 * Static Reliable Hero - Slot 3 (Below Featured Products)
 * Previously "Boxlot hero center" in the database
 */
export default function StaticHeroReliable() {
  return (
    <Hero
      title="Reliable, Efficient Wholesale Solutions"
      subtitle="We're committed to exceptional service, sustainable sourcing, and timely delivery. Your success is our mission—connect the world through the beauty of flowers with Peak Blooms."
      ctaText="Explore Boxlots"
      ctaLink="/shop?boxlotOnly=true"
      backgroundImage="/hero-images/boxlot2.png"
      textPosition="center"
    />
  )
}
