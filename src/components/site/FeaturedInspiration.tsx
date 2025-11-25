import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";

import { db } from "@/lib/db";

export default async function FeaturedInspiration() {
  const inspirationSets = await db.inspirationSet.findMany();
  
  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold font-serif">Inspirational Sets</h2>
            <p className="mt-2 text-muted-foreground">
              Discover curated flower arrangements designed to inspire and delight
            </p>
          </div>
          <Link
            href="/inspirations"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all inspirations →
          </Link>
        </div>

        <div className="flex flex-col gap-12">
          {inspirationSets.map((set, index) => (
            <div
              key={set.slug}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } gap-8 items-center`}
            >
              {/* Image Container */}
              <div className="w-full md:w-2/3 flex-shrink-0">
                <div className="relative aspect-video overflow-hidden rounded-xs shadow-md">
                  <Image
                    src={set.image}
                    alt={set.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Content Container */}
              <div className="w-full md:w-1/3 flex flex-col justify-center">
                <h3 className="text-2xl font-bold font-serif">{set.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {set.subtitle}
                </p>
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
                  {set.excerpt}
                </p>

                <Button asChild className="mt-6 w-full md:w-auto">
                  <Link
                    href={`/inspirations/${set.slug}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    View Set
                    <IconArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
