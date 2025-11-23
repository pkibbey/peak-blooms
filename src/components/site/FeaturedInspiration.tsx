import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";

export interface InspirationSet {
  name: string;
  slug: string;
  subtitle: string;
  image: string;
  excerpt: string;
  inspirationText: string;
  products: Array<{
    name: string;
    slug: string;
  }>;
}

const inspirationSets: InspirationSet[] = [
  {
    name: "Sunset Romance",
    slug: "sunset-romance",
    subtitle: "Warm hues for evening celebrations",
    image: "/featured-products/peach-flower.jpg",
    excerpt:
      "A stunning combination of warm peach and amber tones that evoke the magical hour just before dusk. Perfect for evening receptions and intimate celebrations.",
    inspirationText:
      "This arrangement draws inspiration from the golden hour's fleeting beauty. I combined soft peach flowers with deeper amber accents to create depth and warmth. The voluminous textures balance the delicate blooms, making this set ideal for florists seeking to create memorable moments at sunset celebrations.",
    products: [
      { name: "Peach Flower", slug: "peach-flower" },
      { name: "Green Fluffy", slug: "green-fluffy" },
    ],
  },
  {
    name: "Romantic Elegance",
    slug: "romantic-elegance",
    subtitle: "Timeless pink and white arrangement",
    image: "/featured-products/pink-rose.jpg",
    excerpt:
      "A classic combination that exudes sophistication and grace. The soft pink roses paired with lush greenery create an arrangement that transcends trends.",
    inspirationText:
      "Inspired by classic wedding aesthetics, I curated this set to appeal to traditionalists while maintaining modern elegance. The pink roses provide focal depth, while the abundant green creates visual balance. This set works beautifully for both intimate and grand celebrations, offering versatility for florists managing diverse client needs.",
    products: [
      { name: "Pink Rose", slug: "pink-rose" },
      { name: "Green Fluffy", slug: "green-fluffy" },
    ],
  },
  {
    name: "Pure Serenity",
    slug: "pure-serenity",
    subtitle: "Pristine white and green sanctuary",
    image: "/featured-products/playa-blanca.jpg",
    excerpt:
      "Simplicity meets sophistication in this minimalist arrangement. The pristine white blooms paired with lush greenery create a calming, elegant presence.",
    inspirationText:
      "This set embodies the belief that less is often more. The pure white flowers demand attention without noise, creating a serene focal point. Paired with generous green elements, it speaks to clients seeking understated luxury. Perfect for modern minimalist spaces and those who appreciate refined simplicity.",
    products: [
      { name: "Playa Blanca", slug: "playa-blanca" },
      { name: "Green Fluffy", slug: "green-fluffy" },
    ],
  },
  {
    name: "Lush Garden",
    slug: "lush-garden",
    subtitle: "Abundant greenery with vibrant accents",
    image: "/featured-products/green-fluffy.jpg",
    excerpt:
      "Nature's bounty meets artful arrangement. This set celebrates the beauty of layered textures and verdant tones for creating immersive botanical spaces.",
    inspirationText:
      "I created this set for designers seeking volume and texture-rich arrangements. The primary focus on lush greenery provides an excellent base for clients who prefer to add their own focal flowers, or stands beautifully on its own for those appreciating organic abundance. It's perfect for installations and large-scale projects.",
    products: [
      { name: "Green Fluffy", slug: "green-fluffy" },
      { name: "Peach Flower", slug: "peach-flower" },
    ],
  },
];

export { inspirationSets };

export default function FeaturedInspiration() {
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
            href="/inspiration"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all inspiration →
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
                    href={`/inspiration/${set.slug}`}
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
