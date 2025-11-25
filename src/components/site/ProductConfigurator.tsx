"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import AddToCartButton from "@/components/site/AddToCartButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface ProductVariant {
  id: string;
  price: number;
  stemLength: number | null;
  countPerBunch: number | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stemLength: number | null;
  countPerBunch: number | null;
  variants: ProductVariant[];
}

interface ProductConfiguratorProps {
  product: Product;
  user?: {
    approved: boolean;
  } | null;
}

export function ProductConfigurator({
  product,
  user,
}: ProductConfiguratorProps) {
  const isSignedOut = !user;
  const isUnapproved = user && !user.approved;
  // selectedVariantId derived below via useMemo
  // note: AddToCartButton now handles its own loading state

  // Group variants by stem length and count per bunch
  const hasVariants = product.variants.length > 0;

  // If no variants, use base product details

  // Get unique stem lengths and counts from variants
  const stemLengths = Array.from(
    new Set(
      product.variants
        .map((v) => v.stemLength)
        .filter((l): l is number => l !== null)
    )
  ).sort((a, b) => a - b);

  const counts = Array.from(
    new Set(
      product.variants
        .map((v) => v.countPerBunch)
        .filter((c): c is number => c !== null)
    )
  ).sort((a, b) => a - b);

  const [selectedStemLength, setSelectedStemLength] = useState<string>(
    stemLengths.length > 0 ? stemLengths[0].toString() : ""
  );
  const [selectedCount, setSelectedCount] = useState<string>(
    counts.length > 0 ? counts[0].toString() : ""
  );

  // Derive selectedVariantId from the chosen stem length / count
  const selectedVariantId = useMemo(() => {
    if (!hasVariants) return null;

    const variant = product.variants.find(
      (v) =>
        (v.stemLength?.toString() === selectedStemLength || (!v.stemLength && !selectedStemLength)) &&
        (v.countPerBunch?.toString() === selectedCount || (!v.countPerBunch && !selectedCount))
    );

    return variant?.id ?? null;
  }, [selectedStemLength, selectedCount, hasVariants, product.variants]);

  // If no variants, use base product details
  const currentPrice = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)?.price ?? product.price
    : product.price;


  return (
    <div className="flex flex-col gap-6">
      {/* Price Display */}
      {isSignedOut ? (
        <div className="text-sm text-muted-foreground italic">
          Sign in to view pricing
        </div>
      ) : isUnapproved ? (
        <div className="text-sm text-muted-foreground italic">
          Your account is pending approval. Pricing will be available once approved.
        </div>
      ) : (
        <div className="text-3xl font-bold text-primary">
          ${currentPrice.toFixed(2)}
        </div>
      )}

      {/* Variant Selectors */}
      {hasVariants && (
        <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-200 py-6">
          {stemLengths.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Stem Length
              </label>
              <Select
                value={selectedStemLength}
                onValueChange={setSelectedStemLength}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  {stemLengths.map((length) => (
                    <SelectItem key={length} value={length.toString()}>
                      {length} cm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {counts.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted-foreground">
                Count per Bunch
              </label>
              <Select value={selectedCount} onValueChange={setSelectedCount}>
                <SelectTrigger>
                  <SelectValue placeholder="Select count" />
                </SelectTrigger>
                <SelectContent>
                  {counts.map((count) => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} stems
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Static Specs (if no variants) */}
      {!hasVariants &&
        (product.stemLength || product.countPerBunch) && (
          <div className="border-t border-b border-gray-200 py-6">
            <div className="grid grid-cols-2 gap-4">
              {product.stemLength && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Stem Length
                  </h3>
                  <p className="text-lg font-bold">{product.stemLength} cm</p>
                </div>
              )}
              {product.countPerBunch && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">
                    Count per Bunch
                  </h3>
                  <p className="text-lg font-bold">
                    {product.countPerBunch} stems
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Add to Cart Button */}
      {isSignedOut ? (
        <Button size="lg" className="w-full" asChild>
          <Link href="/auth/signin">Sign in to view pricing</Link>
        </Button>
      ) : isUnapproved ? (
        <Button size="lg" className="w-full" disabled>
          Waiting on Account Approval
        </Button>
      ) : (
        <AddToCartButton
          productId={product.id}
          productVariantId={selectedVariantId}
          productName={product.name}
          disabled={hasVariants && !selectedVariantId}
        />
      )}
    </div>
  );
}
