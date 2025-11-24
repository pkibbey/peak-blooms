import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";

export const metadata = {
  title: "Collections",
  description: "Browse our curated collection of premium flowers",
};

export default async function CollectionsPage() {
  const categories = await db.category.findMany();

  return (
    <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
      <div className="w-full max-w-5xl px-6">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold font-serif">Collections</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Discover our curated selection of premium flower collections
          </p>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {categories.map((collection) => (
            <div
              key={collection.slug}
              className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-zinc-200">
                {collection.image && (
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="flex flex-col justify-between bg-white p-6">
                <div>
                  <h2 className="text-xl font-bold font-serif">
                    {collection.name}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {collection.description}
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
