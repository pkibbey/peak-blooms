"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { ProductModel, ProductVariantModel } from "@/generated/models";
import AddToCartButton from "@/components/site/AddToCartButton";

interface ProductCardProps {
  product: ProductModel & {
    variants?: ProductVariantModel[];
  };
  user?: {
    approved: boolean;
  } | null;
}

export function ProductCard({ product, user }: ProductCardProps) {
  const isUnapproved = user && !user.approved;
  const isApproved = user && user.approved;
  const isSignedOut = !user;

  // Get the first variant if variants exist, otherwise use base product
  const variants = product.variants ?? [];
  const hasVariants = variants.length > 0;
  const defaultVariant = hasVariants ? variants[0] : null;

  // Determine the display price
  const displayPrice = defaultVariant?.price ?? product.price;

  // Check if there are multiple prices across variants
  const hasMultiplePrices =
    hasVariants && new Set(variants.map((v) => v.price)).size > 1;

  // Build variant specs string (e.g., "50cm • 10 stems")
  const variantSpecs = defaultVariant
    ? [
        defaultVariant.stemLength ? `${defaultVariant.stemLength}cm` : null,
        defaultVariant.countPerBunch
          ? `${defaultVariant.countPerBunch} stems`
          : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : [
        product.stemLength ? `${product.stemLength}cm` : null,
        product.countPerBunch ? `${product.countPerBunch} stems` : null,
      ]
        .filter(Boolean)
        .join(" • ");

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
      <div className="flex flex-col justify-between bg-white p-6 grow">
        <div>
          <h3 className="text-xl font-bold font-serif">{product.name}</h3>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {/* Pricing Section */}
          {isApproved && (
            <div>
              <div className="text-lg font-bold text-primary">
                {hasMultiplePrices && "From "}${displayPrice.toFixed(2)}
              </div>
              {variantSpecs && (
                <div className="text-sm text-muted-foreground">
                  {variantSpecs}
                </div>
              )}
            </div>
          )}
          {!isApproved && (
            <div className="text-sm text-muted-foreground">
              {isUnapproved ? "Contact for pricing" : "Sign in for pricing"}
            </div>
          )}

          {/* Add to Cart Button - only for approved users */}
          {isApproved && (
            <AddToCartButton
              productId={product.id}
              productVariantId={defaultVariant?.id}
              productName={product.name}
            />
          )}

          {/* Sign in prompt for signed out users */}
          {isSignedOut && (
            <Button asChild className="w-full" size="sm">
              <Link href="/auth/signin">Sign in to purchase</Link>
            </Button>
          )}

          {/* View Product Button */}
          <Button asChild variant={isApproved ? "outline" : "default"} className="w-full" size="sm">
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
