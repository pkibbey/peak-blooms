"use client";

import { useState, useEffect } from "react";
import { useUserStatus } from "@/lib/useUserStatus";
import { Button } from "@/components/ui/button";
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
  stock: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  stemLength: number | null;
  countPerBunch: number | null;
  stock: number;
  variants: ProductVariant[];
}

interface ProductConfiguratorProps {
  product: Product;
}

export function ProductConfigurator({
  product,
}: ProductConfiguratorProps) {
  const { isSignedOut, isUnapproved } = useUserStatus();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Group variants by stem length and count per bunch
  const hasVariants = product.variants.length > 0;

  // If no variants, use base product details
  const currentPrice = selectedVariantId
    ? product.variants.find((v) => v.id === selectedVariantId)?.price ?? product.price
    : product.price;

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

  // Update selected variant based on dropdowns
  useEffect(() => {
    if (!hasVariants) return;

    const variant = product.variants.find(
      (v) =>
        (v.stemLength?.toString() === selectedStemLength ||
          (!v.stemLength && !selectedStemLength)) &&
        (v.countPerBunch?.toString() === selectedCount ||
          (!v.countPerBunch && !selectedCount))
    );

    setSelectedVariantId(variant?.id ?? null);
  }, [selectedStemLength, selectedCount, hasVariants, product.variants]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          productVariantId: selectedVariantId,
          quantity: 1,
        }),
      });

      if (!res.ok) throw new Error("Failed to add to cart");
      
      // Optional: Add toast notification here
      alert("Added to cart!");
    } catch (error) {
      console.error(error);
      alert("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Price Display */}
      {isSignedOut ? (
        <div className="flex flex-col gap-3">
          <div className="text-sm text-muted-foreground italic">
            Sign in to view pricing
          </div>
          <Button size="sm" asChild variant="outline">
            <Link href="/auth/signin">Sign In</Link>
          </Button>
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
          <Link href="/auth/signin">Sign In to Purchase</Link>
        </Button>
      ) : isUnapproved ? (
        <Button size="lg" className="w-full" disabled>
          Account Approval Needed
        </Button>
      ) : (
        <Button 
          size="lg" 
          className="w-full" 
          onClick={handleAddToCart}
          disabled={isAdding || (hasVariants && !selectedVariantId)}
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </Button>
      )}
    </div>
  );
}
