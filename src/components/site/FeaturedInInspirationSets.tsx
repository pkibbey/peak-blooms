import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { InspirationSetModel } from "@/generated/models";

interface FeaturedInInspirationSetsProps {
  inspirationSets: InspirationSetModel[];
}

export function FeaturedInInspirationSets({
  inspirationSets,
}: FeaturedInInspirationSetsProps) {
  if (!inspirationSets || inspirationSets.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-8">
      <h2 className="text-2xl font-bold font-serif mb-8">
        Featured in These Collections
      </h2>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {inspirationSets.map((set) => (
          <div
            key={set.id}
            className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg"
          >
            {/* Image Container */}
            <div className="relative aspect-square overflow-hidden bg-zinc-200">
              {set.image && (
                <Image
                  src={set.image}
                  alt={set.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
            </div>

            {/* Card Content */}
            <div className="flex flex-col justify-between bg-white p-6 flex-grow">
              <div>
                <h3 className="text-xl font-bold font-serif">{set.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {set.subtitle}
                </p>
              </div>

              <Button asChild className="mt-6 w-full">
                <Link
                  href={`/inspiration/${set.slug}`}
                  className="inline-flex items-center justify-center gap-2"
                >
                  View Collection
                  <IconArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
