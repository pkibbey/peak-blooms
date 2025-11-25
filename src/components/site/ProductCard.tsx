"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { IconArrowRight } from "@/components/ui/icons";
import { ProductModel, ProductVariantModel } from "@/generated/models";
import AddToCartButton from "@/components/site/AddToCartButton";
import { cn } from "@/lib/utils";

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

  // Get variants data - memoize to prevent dependency issues
  const variants = useMemo(() => product.variants ?? [], [product.variants]);
  const hasVariants = variants.length > 0;

  // Get unique stem lengths and counts from variants
  const stemLengths = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((v) => v.stemLength)
            .filter((l): l is number => l !== null)
        )
      ).sort((a, b) => a - b),
    [variants]
  );

  const counts = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .map((v) => v.countPerBunch)
            .filter((c): c is number => c !== null)
        )
      ).sort((a, b) => a - b),
    [variants]
  );

  // State for selected options - initialize from first values in computed arrays
  const [selectedStemLength, setSelectedStemLength] = useState<number | null>(
    () => {
      const lengths = Array.from(
        new Set(
          (product.variants ?? [])
            .map((v) => v.stemLength)
            .filter((l): l is number => l !== null)
        )
      ).sort((a, b) => a - b);
      return lengths.length > 0 ? lengths[0] : null;
    }
  );
  const [selectedCount, setSelectedCount] = useState<number | null>(
    () => {
      const cnts = Array.from(
        new Set(
          (product.variants ?? [])
            .map((v) => v.countPerBunch)
            .filter((c): c is number => c !== null)
        )
      ).sort((a, b) => a - b);
      return cnts.length > 0 ? cnts[0] : null;
    }
  );

  // Compute available counts for the currently selected stem length
  const availableCountsForLength = useMemo(() => {
    if (selectedStemLength === null) return counts;
    return Array.from(
      new Set(
        variants
          .filter((v) => v.stemLength === selectedStemLength)
          .map((v) => v.countPerBunch)
          .filter((c): c is number => c !== null)
      )
    ).sort((a, b) => a - b);
  }, [selectedStemLength, variants, counts]);

  // Compute available stem lengths for the currently selected count
  const availableLengthsForCount = useMemo(() => {
    if (selectedCount === null) return stemLengths;
    return Array.from(
      new Set(
        variants
          .filter((v) => v.countPerBunch === selectedCount)
          .map((v) => v.stemLength)
          .filter((l): l is number => l !== null)
      )
    ).sort((a, b) => a - b);
  }, [selectedCount, variants, stemLengths]);

  // Handler for stem length selection - auto-adjusts count if needed
  const handleStemLengthChange = useCallback((length: number) => {
    setSelectedStemLength(length);
    // Check if current count is available for the new stem length
    const availableCounts = Array.from(
      new Set(
        variants
          .filter((v) => v.stemLength === length)
          .map((v) => v.countPerBunch)
          .filter((c): c is number => c !== null)
      )
    ).sort((a, b) => a - b);
    if (selectedCount !== null && !availableCounts.includes(selectedCount) && availableCounts.length > 0) {
      setSelectedCount(availableCounts[0]);
    }
  }, [variants, selectedCount]);

  // Handler for count selection - auto-adjusts stem length if needed
  const handleCountChange = useCallback((count: number) => {
    setSelectedCount(count);
    // Check if current stem length is available for the new count
    const availableLengths = Array.from(
      new Set(
        variants
          .filter((v) => v.countPerBunch === count)
          .map((v) => v.stemLength)
          .filter((l): l is number => l !== null)
      )
    ).sort((a, b) => a - b);
    if (selectedStemLength !== null && !availableLengths.includes(selectedStemLength) && availableLengths.length > 0) {
      setSelectedStemLength(availableLengths[0]);
    }
  }, [variants, selectedStemLength]);

  // Derive selectedVariantId from the chosen stem length / count
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;

    const variant = variants.find(
      (v) =>
        (v.stemLength === selectedStemLength ||
          (v.stemLength === null && selectedStemLength === null)) &&
        (v.countPerBunch === selectedCount ||
          (v.countPerBunch === null && selectedCount === null))
    );

    return variant ?? variants[0];
  }, [selectedStemLength, selectedCount, hasVariants, variants]);

  // Determine the display price based on selected variant (variants required)
  const displayPrice = selectedVariant?.price ?? variants[0]?.price ?? 0;

  // Build variant specs string from selected variant (variants required)
  const variantSpecs = selectedVariant
    ? [
        selectedVariant.stemLength ? `${selectedVariant.stemLength}cm` : null,
        selectedVariant.countPerBunch
          ? `${selectedVariant.countPerBunch} stems`
          : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : variants[0]
    ? [
        variants[0].stemLength ? `${variants[0].stemLength}cm` : null,
        variants[0].countPerBunch ? `${variants[0].countPerBunch} stems` : null,
      ]
        .filter(Boolean)
        .join(" • ")
    : "";

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
          {/* Variant Selectors - only show for approved users with variants */}
          {isApproved && hasVariants && (stemLengths.length >= 1 || counts.length >= 1) && (
            <div className="flex flex-col gap-2">
              {/* Stem Length Options */}
              {stemLengths.length >= 1 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">
                    Length
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {stemLengths.map((length) => {
                      const isAvailable = availableLengthsForCount.includes(length);
                      const isSelected = selectedStemLength === length;
                      return (
                        <button
                          key={length}
                          onClick={() => handleStemLengthChange(length)}
                          disabled={!isAvailable}
                          className={cn(
                            "px-2 py-1 text-xs rounded-sm border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : isAvailable
                                ? "bg-white text-muted-foreground border-gray-200 hover:border-primary"
                                : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                          )}
                        >
                          {length}cm
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Count Per Bunch Options */}
              {counts.length >= 1 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground mb-1 block">
                    Count
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {counts.map((count) => {
                      const isAvailable = availableCountsForLength.includes(count);
                      const isSelected = selectedCount === count;
                      return (
                        <button
                          key={count}
                          onClick={() => handleCountChange(count)}
                          disabled={!isAvailable}
                          className={cn(
                            "px-2 py-1 text-xs rounded-sm border transition-colors",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : isAvailable
                                ? "bg-white text-muted-foreground border-gray-200 hover:border-primary"
                                : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                          )}
                        >
                          {count} stems
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pricing Section */}
          {isApproved && (
            <div>
              <div className="text-lg font-bold text-primary">
                ${displayPrice.toFixed(2)}
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
              productVariantId={selectedVariant?.id}
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
