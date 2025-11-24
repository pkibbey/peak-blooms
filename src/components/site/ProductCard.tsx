"use client";

import Link from "next/link";
import Image from "next/image";
import { useUserStatus } from "@/lib/useUserStatus";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { ProductModel } from "@/generated/models";

interface ProductCardProps {
  product: ProductModel;
}

export function ProductCard({ product }: ProductCardProps) {
  const { isSignedOut, isUnapproved, isApproved } = useUserStatus();

  return (
    <div className="group flex flex-col overflow-hidden rounded-xs shadow-md transition-shadow hover:shadow-lg">
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
      <div className="flex flex-col justify-between bg-white p-6 flex-grow">
        <div>
          <h3 className="text-xl font-bold font-serif">{product.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {isApproved && (
            <div className="text-lg font-bold text-primary">
              ${product.price.toFixed(2)}
            </div>
          )}
          {!isApproved && (
            <div className="text-sm text-muted-foreground">
              {isUnapproved ? "Contact for pricing" : "Sign in for pricing"}
            </div>
          )}
          <Button asChild className="w-full">
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
    </div>
  );
}
