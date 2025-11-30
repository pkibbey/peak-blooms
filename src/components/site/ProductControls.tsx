"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import AddToCartButton from "@/components/site/AddToCartButton"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ProductVariant {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
  isBoxlot: boolean
}

interface Product {
  id: string
  name: string
  variants?: ProductVariant[]
}

interface ProductControlsProps {
  product: Product
  user?: {
    approved: boolean
  } | null
  mode?: "card" | "detail"
}

export function ProductControls({ product, user, mode = "card" }: ProductControlsProps) {
  const isUnapproved = user && !user.approved
  const isSignedOut = !user
  const isApproved = !!user?.approved

  // Get variants data - memoize to prevent dependency issues
  const productVariants = useMemo(() => product.variants ?? [], [product.variants])
  const hasVariants = productVariants.length > 0

  // Detect when we're in a "boxlot" context: all variants present are boxlots.
  // In that case we should only consider variants which have both stemLength and
  // countPerBunch populated when deriving the selectable options.
  const isBoxlotMode = productVariants.length > 0 && productVariants.every((v) => v.isBoxlot)

  // Source variants used for selectors.
  // When in boxlot mode, only use variants that have both stemLength and countPerBunch
  // populated (complete boxlot variants). Otherwise use all product variants.
  const srcVariants = useMemo(
    () =>
      isBoxlotMode
        ? productVariants.filter((v) => v.stemLength !== null && v.countPerBunch !== null)
        : productVariants,
    [productVariants, isBoxlotMode]
  )

  // Get unique stem lengths and counts from source variants
  const stemLengths = useMemo(
    () =>
      Array.from(
        new Set(srcVariants.map((v) => v.stemLength).filter((l): l is number => l !== null))
      ).sort((a, b) => a - b),
    [srcVariants]
  )

  const counts = useMemo(
    () =>
      Array.from(
        new Set(srcVariants.map((v) => v.countPerBunch).filter((c): c is number => c !== null))
      ).sort((a, b) => a - b),
    [srcVariants]
  )

  // State for selected options - initialize from first values in computed arrays
  const [selectedStemLength, setSelectedStemLength] = useState<number | null>(() => {
    const lengths = Array.from(
      new Set(srcVariants.map((v) => v.stemLength).filter((l): l is number => l !== null))
    ).sort((a, b) => a - b)
    return lengths.length > 0 ? lengths[0] : null
  })

  const [selectedCount, setSelectedCount] = useState<number | null>(() => {
    const cnts = Array.from(
      new Set(srcVariants.map((v) => v.countPerBunch).filter((c): c is number => c !== null))
    ).sort((a, b) => a - b)
    return cnts.length > 0 ? cnts[0] : null
  })

  // Compute available counts for the currently selected stem length
  const availableCountsForLength = useMemo(() => {
    if (selectedStemLength === null) return counts
    return Array.from(
      new Set(
        srcVariants
          .filter((v) => v.stemLength === selectedStemLength)
          .map((v) => v.countPerBunch)
          .filter((c): c is number => c !== null)
      )
    ).sort((a, b) => a - b)
  }, [selectedStemLength, srcVariants, counts])

  // Compute available stem lengths for the currently selected count
  const availableLengthsForCount = useMemo(() => {
    if (selectedCount === null) return stemLengths
    return Array.from(
      new Set(
        srcVariants
          .filter((v) => v.countPerBunch === selectedCount)
          .map((v) => v.stemLength)
          .filter((l): l is number => l !== null)
      )
    ).sort((a, b) => a - b)
  }, [selectedCount, srcVariants, stemLengths])

  // Handler for stem length selection - auto-adjusts count if needed
  const handleStemLengthChange = useCallback(
    (length: number) => {
      setSelectedStemLength(length)
      // Check if current count is available for the new stem length
      const availableCounts = Array.from(
        new Set(
          srcVariants
            .filter((v) => v.stemLength === length)
            .map((v) => v.countPerBunch)
            .filter((c): c is number => c !== null)
        )
      ).sort((a, b) => a - b)
      if (
        selectedCount !== null &&
        !availableCounts.includes(selectedCount) &&
        availableCounts.length > 0
      ) {
        setSelectedCount(availableCounts[0])
      }
    },
    [srcVariants, selectedCount]
  )

  // Handler for count selection - auto-adjusts stem length if needed
  const handleCountChange = useCallback(
    (count: number) => {
      setSelectedCount(count)
      // Check if current stem length is available for the new count
      const availableLengths = Array.from(
        new Set(
          srcVariants
            .filter((v) => v.countPerBunch === count)
            .map((v) => v.stemLength)
            .filter((l): l is number => l !== null)
        )
      ).sort((a, b) => a - b)
      if (
        selectedStemLength !== null &&
        !availableLengths.includes(selectedStemLength) &&
        availableLengths.length > 0
      ) {
        setSelectedStemLength(availableLengths[0])
      }
    },
    [srcVariants, selectedStemLength]
  )

  // Derive selectedVariantId from the chosen stem length / count
  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null

    const variant = srcVariants.find(
      (v) =>
        (v.stemLength === selectedStemLength ||
          (v.stemLength === null && selectedStemLength === null)) &&
        (v.countPerBunch === selectedCount || (v.countPerBunch === null && selectedCount === null))
    )

    return variant ?? srcVariants[0] ?? productVariants[0]
  }, [selectedStemLength, selectedCount, hasVariants, srcVariants, productVariants])
  // Reset selected defaults whenever our available source variants change
  // (for example, when toggling the bulk boxlots filter on the shop page).
  useEffect(() => {
    const lengths = Array.from(
      new Set(srcVariants.map((v) => v.stemLength).filter((l): l is number => l !== null))
    ).sort((a, b) => a - b)

    const cnts = Array.from(
      new Set(srcVariants.map((v) => v.countPerBunch).filter((c): c is number => c !== null))
    ).sort((a, b) => a - b)

    setSelectedStemLength(lengths.length > 0 ? lengths[0] : null)
    setSelectedCount(cnts.length > 0 ? cnts[0] : null)
  }, [srcVariants])

  // Determine the display price based on selected variant (variants required)
  const currentPrice =
    selectedVariant?.price ?? srcVariants[0]?.price ?? productVariants[0]?.price ?? 0

  // Build variant summary string
  const variantSummary = [
    selectedStemLength ? `${selectedStemLength} cm` : null,
    selectedCount ? `${selectedCount} stems` : null,
  ]
    .filter(Boolean)
    .join(" • ")

  const showSelectors = isApproved && hasVariants && (stemLengths.length >= 1 || counts.length >= 1)

  return (
    <div className={cn("flex flex-col", mode === "detail" ? "gap-6" : "gap-3 mt-6")}>
      {/* Variant Selectors */}
      {showSelectors && (
        <div className={cn("flex flex-col", mode === "detail" ? "gap-4" : "gap-2")}>
          {stemLengths.length >= 1 && (
            <div className={mode === "detail" ? "space-y-2" : ""}>
              <Label
                className={
                  mode === "card" ? "text-xs font-medium text-muted-foreground mb-1 block" : ""
                }
              >
                Stem Length
              </Label>
              <div className={cn("flex flex-wrap", mode === "detail" ? "gap-2" : "gap-1")}>
                {stemLengths.map((length) => {
                  const isAvailable = availableLengthsForCount.includes(length)
                  const isSelected = selectedStemLength === length
                  return (
                    <Button
                      key={length}
                      size="sm"
                      onClick={() => handleStemLengthChange(length)}
                      disabled={!isAvailable}
                      variant={isSelected ? "default" : isAvailable ? "outline" : "ghost"}
                      className={cn(
                        "rounded-sm border transition-colors",
                        mode === "detail" ? "px-4 py-2 text-sm" : "h-7 px-2 text-xs",
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
            <div className={mode === "detail" ? "space-y-2" : ""}>
              <Label
                className={
                  mode === "card" ? "text-xs font-medium text-muted-foreground mb-1 block" : ""
                }
              >
                Stem Count
              </Label>
              <div className={cn("flex flex-wrap", mode === "detail" ? "gap-2" : "gap-1")}>
                {counts.map((count) => {
                  const isAvailable = availableCountsForLength.includes(count)
                  const isSelected = selectedCount === count
                  return (
                    <Button
                      key={count}
                      size="sm"
                      onClick={() => handleCountChange(count)}
                      disabled={!isAvailable}
                      variant={isSelected ? "default" : isAvailable ? "outline" : "ghost"}
                      className={cn(
                        "rounded-sm border transition-colors",
                        mode === "detail" ? "px-4 py-2 text-sm" : "h-7 px-2 text-xs",
                        isSelected
                          ? "border-primary"
                          : isAvailable
                            ? "bg-white text-muted-foreground border-gray-200 hover:border-primary"
                            : "bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed"
                      )}
                    >
                      x {count}
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
          <div
            className={cn("font-bold text-primary", mode === "detail" ? "text-4xl" : "text-3xl")}
          >
            ${currentPrice.toFixed(2)}
          </div>
          {variantSummary && (
            <div
              className={cn(
                "text-muted-foreground mt-1",
                mode === "detail" ? "text-xl" : "text-base"
              )}
            >
              {variantSummary}
            </div>
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
          productVariantId={selectedVariant?.id ?? null}
          productName={product.name}
          disabled={hasVariants && !selectedVariant}
        />
      )}
    </div>
  )
}
