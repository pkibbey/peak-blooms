import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";

const collections = [
  {
    name: "Classic Roses",
    subtitle: "Timeless elegance and beauty",
    image: "/featured-categories/classic-roses.png",
    slug: "classic-roses",
  },
  {
    name: "Exotic Blooms",
    subtitle: "Bold and vibrant arrangements",
    image: "/featured-categories/exotic-blooms.png",
    slug: "exotic-blooms",
  },
  {
    name: "Seasonal Wildflowers",
    subtitle: "Nature's finest seasonal selections",
    image: "/featured-categories/seasonal-wildflowers.png",
    slug: "seasonal-wildflowers",
  },
];

export default function FeaturedCollections() {
  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold font-serif">Featured Collections</h2>
            <p className="mt-2 text-muted-foreground">
              Discover our curated selection of premium flower collections
            </p>
          </div>
          <Link href="/collections" className="text-sm font-medium text-primary hover:underline">
            View all collections →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {collections.map((collection) => (
            <div
              key={collection.slug}
              className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-zinc-200">
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  loading="eager"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Card Content */}
              <div className="flex flex-col justify-between bg-white p-6">
                <div>
                  <h3 className="text-xl font-bold font-serif">{collection.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {collection.subtitle}
                  </p>
                </div>

                <Button asChild className="mt-6 w-full">
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    Shop Now
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
