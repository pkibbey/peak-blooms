"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import AddToCartButton from "@/components/site/AddToCartButton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Label } from "../ui/label"

interface ProductVariant {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
}

interface Product {
  id: string
  name: string
  variants: ProductVariant[]
}

interface ProductConfiguratorProps {
  product: Product
  user?: {
    approved: boolean
  } | null
}

export function ProductConfigurator({ product, user }: ProductConfiguratorProps) {
  const isSignedOut = !user
  const isUnapproved = user && !user.approved
  // selectedVariantId derived below via useMemo
  // note: AddToCartButton now handles its own loading state

  // Group variants by stem length and count per bunch
  const hasVariants = product.variants.length > 0

  // If no variants, use base product details

  // Get unique stem lengths and counts from variants
  const stemLengths = Array.from(
    new Set(product.variants.map((v) => v.stemLength).filter((l): l is number => l !== null))
  ).sort((a, b) => a - b)

  const counts = Array.from(
    new Set(product.variants.map((v) => v.countPerBunch).filter((c): c is number => c !== null))
  ).sort((a, b) => a - b)

  const [selectedStemLength, setSelectedStemLength] = useState<string>(
    stemLengths.length > 0 ? stemLengths[0].toString() : ""
  )
  const [selectedCount, setSelectedCount] = useState<string>(
    counts.length > 0 ? counts[0].toString() : ""
  )

  // Compute available counts for the currently selected stem length
  const availableCountsForLength = useMemo(() => {
    if (!selectedStemLength) return counts
    const length = parseInt(selectedStemLength)
    return Array.from(
      new Set(
        product.variants
          .filter((v) => v.stemLength === length)
          .map((v) => v.countPerBunch)
          .filter((c): c is number => c !== null)
      )
    ).sort((a, b) => a - b)
  }, [selectedStemLength, product.variants, counts])

  // Compute available stem lengths for the currently selected count
  const availableLengthsForCount = useMemo(() => {
    if (!selectedCount) return stemLengths
    const count = parseInt(selectedCount)
    return Array.from(
      new Set(
        product.variants
          .filter((v) => v.countPerBunch === count)
          .map((v) => v.stemLength)
          .filter((l): l is number => l !== null)
      )
    ).sort((a, b) => a - b)
  }, [selectedCount, product.variants, stemLengths])

  // Handler for stem length selection - auto-adjusts count if needed
  const handleStemLengthChange = (value: string) => {
    setSelectedStemLength(value)
    const length = parseInt(value)
    // Check if current count is available for the new stem length
    const availableCounts = Array.from(
      new Set(
        product.variants
          .filter((v) => v.stemLength === length)
          .map((v) => v.countPerBunch)
          .filter((c): c is number => c !== null)
      )
    ).sort((a, b) => a - b)
    const currentCount = selectedCount ? parseInt(selectedCount) : null
    if (
      currentCount !== null &&
      !availableCounts.includes(currentCount) &&
      availableCounts.length > 0
    ) {
      setSelectedCount(availableCounts[0].toString())
    }
  }

  // Handler for count selection - auto-adjusts stem length if needed
  const handleCountChange = (value: string) => {
    setSelectedCount(value)
    const count = parseInt(value)
    // Check if current stem length is available for the new count
    const availableLengths = Array.from(
      new Set(
        product.variants
          .filter((v) => v.countPerBunch === count)
          .map((v) => v.stemLength)
          .filter((l): l is number => l !== null)
      )
    ).sort((a, b) => a - b)
    const currentLength = selectedStemLength ? parseInt(selectedStemLength) : null
    if (
      currentLength !== null &&
      !availableLengths.includes(currentLength) &&
      availableLengths.length > 0
    ) {
      setSelectedStemLength(availableLengths[0].toString())
    }
  }

  // Derive selectedVariantId from the chosen stem length / count
  const selectedVariantId = useMemo(() => {
    if (!hasVariants) return null

    const variant = product.variants.find(
      (v) =>
        (v.stemLength?.toString() === selectedStemLength ||
          (!v.stemLength && !selectedStemLength)) &&
        (v.countPerBunch?.toString() === selectedCount || (!v.countPerBunch && !selectedCount))
    )

    return variant?.id ?? null
  }, [selectedStemLength, selectedCount, hasVariants, product.variants])

  // Variants are always required, get price from selected or first variant
  const currentPrice = selectedVariantId
    ? (product.variants.find((v) => v.id === selectedVariantId)?.price ??
      product.variants[0]?.price ??
      0)
    : (product.variants[0]?.price ?? 0)

  // Build variant summary string
  const variantSummary = [
    selectedStemLength ? `${selectedStemLength} cm` : null,
    selectedCount ? `${selectedCount} stems` : null,
  ]
    .filter(Boolean)
    .join(" • ")

  return (
    <div className="flex flex-col gap-6">
      {/* Variant Selectors */}
      {hasVariants && (stemLengths.length >= 1 || counts.length >= 1) && (
        <div className="flex flex-col gap-4">
          {stemLengths.length >= 1 && (
            <div className="space-y-2">
              <Label>Stem Length</Label>
              <div className="flex flex-wrap gap-2">
                {stemLengths.map((length) => {
                  const isAvailable = availableLengthsForCount.includes(length)
                  const isSelected = selectedStemLength === length.toString()
                  return (
                    <Button
                      key={length}
                      size="sm"
                      onClick={() => handleStemLengthChange(length.toString())}
                      disabled={!isAvailable}
                      variant={isSelected ? "default" : isAvailable ? "outline" : "ghost"}
                      className={cn(
                        "px-4 py-2 text-sm rounded-sm border transition-colors",
                        isSelected
                          ? "border-primary"
                          : isAvailable
                            ? "bg-white text-muted-foreground border-gray-200 hover:border-primary"
                            : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                      )}
                    >
                      {length} cm
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {counts.length >= 1 && (
            <div className="space-y-2">
              <Label>Stem Count</Label>
              <div className="flex flex-wrap gap-2">
                {counts.map((count) => {
                  const isAvailable = availableCountsForLength.includes(count)
                  const isSelected = selectedCount === count.toString()
                  return (
                    <Button
                      key={count}
                      size="sm"
                      onClick={() => handleCountChange(count.toString())}
                      disabled={!isAvailable}
                      variant={isSelected ? "default" : isAvailable ? "outline" : "ghost"}
                      className={cn(
                        "px-4 py-2 text-sm rounded-sm border transition-colors",
                        isSelected
                          ? "border-primary"
                          : isAvailable
                            ? "bg-white text-muted-foreground border-gray-200 hover:border-primary"
                            : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                      )}
                    >
                      {count} stems
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Price Display & Variant Summary */}
      {isSignedOut ? (
        <div className="text-sm text-muted-foreground italic">Sign in to view pricing</div>
      ) : isUnapproved ? (
        <div className="text-sm text-muted-foreground italic">
          Your account is pending approval. Pricing will be available once approved.
        </div>
      ) : (
        <div>
          <div className="text-3xl font-bold text-primary">${currentPrice.toFixed(2)}</div>
          {variantSummary && (
            <div className="text-lg text-muted-foreground mt-1">{variantSummary}</div>
          )}
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
  )
}
