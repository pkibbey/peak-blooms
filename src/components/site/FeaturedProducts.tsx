"use client";

import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  price: number;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products?featured=true");
        if (response.ok) {
          const data = await response.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-start bg-white py-16 font-sans">
        <div className="w-full max-w-5xl px-6">
          <p className="text-muted-foreground">Loading featured products...</p>
        </div>
      </div>
    );
  }

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
              className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-zinc-200">
                {product.image && (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
              </div>

              {/* Card Content */}
              <div className="flex flex-col justify-between bg-white p-6">
                <div>
                  <h3 className="text-xl font-bold font-serif">{product.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.description}
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
