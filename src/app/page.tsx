import FeaturedCollections from "@/components/site/FeaturedCollections"
import FeaturedProducts from "@/components/site/FeaturedProducts"
import StaticHeroBoxlots from "@/components/site/StaticHeroBoxlots"
import StaticHeroPrimary from "@/components/site/StaticHeroPrimary"
import StaticHeroReliable from "@/components/site/StaticHeroReliable"

export default async function Home() {
  return (
    <>
      {/* Slot 1: Above Featured Collections */}
      <StaticHeroPrimary />

      <FeaturedCollections />

      {/* Slot 2: Between Featured Collections and Featured Products */}
      <StaticHeroBoxlots />

      <FeaturedProducts />

      {/* Slot 3: Below Featured Products */}
      <StaticHeroReliable />
    </>
  )
}
