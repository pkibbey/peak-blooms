"use client";

import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export default function FeaturedCollections() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
        <div className="w-full max-w-5xl px-6">
          <p className="text-muted-foreground">Loading collections...</p>
        </div>
      </div>
    );
  }

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
                    loading="eager"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="flex flex-col justify-between bg-white p-6">
                <div>
                  <h3 className="text-xl font-bold font-serif">{collection.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {collection.name === "Classic Roses"
                      ? "Timeless elegance and beauty"
                      : collection.name === "Exotic Blooms"
                        ? "Bold and vibrant arrangements"
                        : "Nature's finest seasonal selections"}
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
