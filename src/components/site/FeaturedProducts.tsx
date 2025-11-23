import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";

const products = [
  {
    name: "Green Fluffy",
    subtitle: "Lush and voluminous arrangements",
    image: "/featured-products/green-fluffy.jpg",
    slug: "green-fluffy",
  },
  {
    name: "Peach Flower",
    subtitle: "Warm and inviting blooms",
    image: "/featured-products/peach-flower.jpg",
    slug: "peach-flower",
  },
  {
    name: "Pink Rose",
    subtitle: "Elegant and romantic selections",
    image: "/featured-products/pink-rose.jpg",
    slug: "pink-rose",
  },
  {
    name: "Playa Blanca",
    subtitle: "Pristine white arrangements",
    image: "/featured-products/playa-blanca.jpg",
    slug: "playa-blanca",
  },
];

export default function FeaturedProducts() {
  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold">Featured Products</h2>
            <p className="mt-2 text-muted-foreground">
              Explore our handpicked selection of premium flowers
            </p>
          </div>
          <Link href="/shop" className="text-sm font-medium text-primary hover:underline">
            View all products →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.slug}
              className="group flex flex-col overflow-hidden rounded-lg shadow-md transition-shadow hover:shadow-lg"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-zinc-200">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Card Content */}
              <div className="flex flex-col justify-between bg-white p-6">
                <div>
                  <h3 className="text-xl font-bold">{product.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.subtitle}
                  </p>
                </div>

                <Button asChild className="mt-6 w-full">
                  <Link
                    href={`/shop/${product.slug}`}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    View Product
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
