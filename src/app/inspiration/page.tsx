import Link from "next/link";
import Image from "next/image";
import { inspirationSets } from "@/components/site/FeaturedInspiration";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";

export default function InspirationPage() {
  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-3xl px-6">
        {/* Page Header */}
        <div className="mb-16">
          <h1 className="text-4xl font-extrabold font-serif">Inspirational Sets</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Curated flower arrangements designed by our artisans to inspire and delight. 
            Explore each set to discover the story behind the arrangement and order complete 
            collections for your most memorable celebrations.
          </p>
        </div>

        {/* Gallery Feed */}
        <div className="flex flex-col gap-16">
          {inspirationSets.map((set, index) => (
            <div
              key={set.slug}
              className={`flex flex-col ${
                index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
              } gap-8 items-start md:items-center`}
            >
              {/* Image Container */}
              <div className="w-full md:w-1/2 flex-shrink-0">
                <Link href={`/inspiration/${set.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-xs shadow-md hover:shadow-lg transition-shadow">
                    <Image
                      src={set.image}
                      alt={set.name}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
              </div>

              {/* Content Container */}
              <div className="w-full md:w-1/2 flex flex-col justify-start">
                <Link href={`/inspiration/${set.slug}`} className="group">
                  <h2 className="text-3xl font-bold group-hover:text-primary transition-colors">
                    {set.name}
                  </h2>
                </Link>
                <p className="mt-2 text-sm text-muted-foreground">
                  {set.subtitle}
                </p>
                <p className="mt-6 text-base leading-relaxed text-gray-700">
                  {set.excerpt}
                </p>

                <Button asChild className="mt-6 w-full md:w-auto">
                  <Link
                    href={`/inspiration/${set.slug}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    View Set Details
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
