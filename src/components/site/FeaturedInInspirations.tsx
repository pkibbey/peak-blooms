import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { IconArrowRight } from "@/components/ui/icons"
import type { InspirationModel, InspirationProductModel } from "@/generated/models"

interface FeaturedInInspirationsProps {
  inspirations: (InspirationProductModel & {
    inspiration: InspirationModel
  })[]
}

export function FeaturedInInspirations({ inspirations }: FeaturedInInspirationsProps) {
  if (!inspirations || inspirations.length === 0) {
    return null
  }

  // Extract unique inspirations from the join table entries
  const uniqueInspirations = inspirations.reduce((acc, isp) => {
    if (!acc.find((s) => s.id === isp.inspiration.id)) {
      acc.push(isp.inspiration)
    }
    return acc
  }, [] as InspirationModel[])

  return (
    <div className="mt-12 pt-8">
      <h2 className="text-2xl font-bold font-serif mb-8">Featured in These Inspirations</h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {uniqueInspirations.map((inspiration) => (
          <div
            key={inspiration.id}
            className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg"
          >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-zinc-200">
              {inspiration.image && (
                <Image
                  src={inspiration.image}
                  alt={inspiration.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>

            {/* Card Content */}
            <div className="flex flex-col justify-between bg-white p-6 grow">
              <div>
                <h3 className="text-xl font-bold font-serif">{inspiration.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {inspiration.subtitle}
                </p>
              </div>

              <Button asChild className="mt-6 w-full">
                <Link
                  href={`/inspirations/${inspiration.slug}`}
                  className="inline-flex items-center justify-center gap-2"
                >
                  View Inspiration
                  <IconArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
