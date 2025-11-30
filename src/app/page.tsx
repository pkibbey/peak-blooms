import FeaturedCollections from "@/components/site/FeaturedCollections"
import FeaturedProducts from "@/components/site/FeaturedProducts"
import Hero from "@/components/site/Hero"
import { db } from "@/lib/db"

async function getHeroesBySlot(slot: number) {
  try {
    return await db.heroBanner.findMany({
      where: { slotPosition: slot },
      orderBy: { createdAt: "asc" },
    })
  } catch (error) {
    // Defensive: if the DB schema is out-of-sync (missing column) or DB is unreachable
    // return an empty array instead of crashing the entire page render. This keeps
    // the site usable while you apply migrations. The real fix is to run the Prisma
    // migrations so the schema matches the generated client.
    console.error(`Failed to load hero slot ${slot}:`, error)
    return []
  }
}

export default async function Home() {
  const [slot1Heroes, slot2Heroes, slot3Heroes] = await Promise.all([
    getHeroesBySlot(1),
    getHeroesBySlot(2),
    getHeroesBySlot(3),
  ])

  return (
    <>
      {/* Slot 1: Above Featured Collections */}
      {slot1Heroes.map((hero) => (
        <Hero
          key={hero.id}
          title={hero.title}
          subtitle={hero.subtitle}
          textPosition={
            ["left", "center", "right"].includes(hero.textPosition as string)
              ? (hero.textPosition as "left" | "center" | "right")
              : undefined
          }
          ctaText={hero.ctaText}
          ctaLink={hero.ctaLink}
          backgroundImage={hero.backgroundType === "IMAGE" ? hero.backgroundImage : null}
          gradientPreset={hero.backgroundType === "GRADIENT" ? hero.gradientPreset : null}
        />
      ))}

      <FeaturedCollections />

      {/* Slot 2: Between Featured Collections and Featured Products */}
      {slot2Heroes.map((hero) => (
        <Hero
          key={hero.id}
          title={hero.title}
          subtitle={hero.subtitle}
          textPosition={
            ["left", "center", "right"].includes(hero.textPosition as string)
              ? (hero.textPosition as "left" | "center" | "right")
              : undefined
          }
          ctaText={hero.ctaText}
          ctaLink={hero.ctaLink}
          backgroundImage={hero.backgroundType === "IMAGE" ? hero.backgroundImage : null}
          gradientPreset={hero.backgroundType === "GRADIENT" ? hero.gradientPreset : null}
        />
      ))}

      <FeaturedProducts />

      {/* Slot 3: Below Featured Products */}
      {slot3Heroes.map((hero) => (
        <Hero
          key={hero.id}
          title={hero.title}
          subtitle={hero.subtitle}
          textPosition={
            ["left", "center", "right"].includes(hero.textPosition as string)
              ? (hero.textPosition as "left" | "center" | "right")
              : undefined
          }
          ctaText={hero.ctaText}
          ctaLink={hero.ctaLink}
          backgroundImage={hero.backgroundType === "IMAGE" ? hero.backgroundImage : null}
          gradientPreset={hero.backgroundType === "GRADIENT" ? hero.gradientPreset : null}
        />
      ))}
    </>
  )
}
