"use client"

import { ChevronDown, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { FilterSection } from "@/components/filters/FilterSection"
import { ColorSelector } from "@/components/site/ColorSelector"
import { SearchInput } from "@/components/site/SearchInput"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES } from "@/lib/product-types"
import { useFilterState } from "@/lib/useFilterState"
import { ViewToggle } from "./ViewToggle"

interface ShopFiltersProps {
  availableColorIds?: string[]
  availableCollections?: Array<{ id: string; name: string }>
}

export function ShopFilters({
  availableColorIds = [],
  availableCollections = [],
}: ShopFiltersProps) {
  const { searchParams, navigateWithParams, getParamsWithFilters, clearAllFilters } =
    useFilterState({
      basePath: "/shop",
      searchParamNames: {},
    })

  const currentSearch = searchParams.get("search") || ""
  const [searchTerm, setSearchTerm] = useState<string>(currentSearch)

  // Parse current filter state from URL
  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) || []
  const currentCollectionIds = searchParams.get("collectionIds")?.split(",").filter(Boolean) || []
  const currentPriceMin = searchParams.get("priceMin") || ""
  const currentPriceMax = searchParams.get("priceMax") || ""
  const currentProductType = searchParams.get("productType") || ""

  // Local state for filters
  const [selectedColors, setSelectedColors] = useState<string[]>(currentColors)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(currentCollectionIds)
  const [priceMin, setPriceMin] = useState<string>(currentPriceMin)
  const [priceMax, setPriceMax] = useState<string>(currentPriceMax)
  const [selectedProductType, setSelectedProductType] = useState<string>(currentProductType)

  // Check if any filters are active
  const hasActiveFilters =
    !!searchTerm ||
    selectedColors.length > 0 ||
    selectedCollectionIds.length > 0 ||
    !!priceMin ||
    !!priceMax ||
    !!selectedProductType

  // Collapsible open state (default: open on desktop, closed on mobile)
  const [open, setOpen] = useState<boolean>(true)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    // set initial state based on current viewport
    setOpen(mq.matches)
    const handler = (e: MediaQueryListEvent) => {
      // If transitioning to mobile (query no longer matches), close the filters.
      if (!e.matches) {
        setOpen(false)
      }
      // If transitioning to desktop, do nothing (avoid auto-opening).
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Helper to update all filters at once
  const updateFilters = useCallback(
    (
      colors: string[],
      collectionIds: string[],
      priceMinVal: string,
      priceMaxVal: string,
      productType: string
    ) => {
      const updates: Record<string, string | null> = {}

      if (colors.length > 0) {
        updates.colors = colors.join(",")
      } else {
        updates.colors = null
      }

      if (collectionIds.length > 0) {
        updates.collectionIds = collectionIds.join(",")
      } else {
        updates.collectionIds = null
      }

      if (priceMinVal) {
        updates.priceMin = priceMinVal
      } else {
        updates.priceMin = null
      }

      if (priceMaxVal) {
        updates.priceMax = priceMaxVal
      } else {
        updates.priceMax = null
      }

      if (productType) {
        updates.productType = productType
      } else {
        updates.productType = null
      }

      const params = getParamsWithFilters(updates)
      navigateWithParams(params)
    },
    [navigateWithParams, getParamsWithFilters]
  )

  // Handle color changes - apply instantly
  const handleColorsChange = useCallback(
    (colors: string[]) => {
      setSelectedColors(colors)
      updateFilters(colors, selectedCollectionIds, priceMin, priceMax, selectedProductType)
    },
    [selectedCollectionIds, priceMin, priceMax, updateFilters, selectedProductType]
  )

  // Handle collection toggle - add/remove from selection
  const toggleCollection = useCallback(
    (collectionId: string) => {
      const newCollectionIds = selectedCollectionIds.includes(collectionId)
        ? selectedCollectionIds.filter((id) => id !== collectionId)
        : [...selectedCollectionIds, collectionId]
      setSelectedCollectionIds(newCollectionIds)
      updateFilters(selectedColors, newCollectionIds, priceMin, priceMax, selectedProductType)
    },
    [selectedColors, selectedCollectionIds, priceMin, priceMax, updateFilters, selectedProductType]
  )

  // Handle product type toggle - select/deselect
  const toggleProductType = useCallback(
    (type: string) => {
      const newProductType = selectedProductType === type ? "" : type
      setSelectedProductType(newProductType)
      updateFilters(selectedColors, selectedCollectionIds, priceMin, priceMax, newProductType)
    },
    [selectedProductType, selectedColors, selectedCollectionIds, priceMin, priceMax, updateFilters]
  )

  // Clear all product types
  const clearProductTypes = useCallback(() => {
    setSelectedProductType("")
    updateFilters(selectedColors, selectedCollectionIds, priceMin, priceMax, "")
  }, [selectedColors, selectedCollectionIds, priceMin, priceMax, updateFilters])

  // Clear all collections
  const clearCollections = useCallback(() => {
    setSelectedCollectionIds([])
    updateFilters(selectedColors, [], priceMin, priceMax, selectedProductType)
  }, [selectedColors, priceMin, priceMax, updateFilters, selectedProductType])

  // Apply filters for numeric inputs (blur/Enter)
  const applyFilters = useCallback(() => {
    updateFilters(selectedColors, selectedCollectionIds, priceMin, priceMax, selectedProductType)
  }, [
    selectedColors,
    selectedCollectionIds,
    priceMin,
    priceMax,
    updateFilters,
    selectedProductType,
  ])

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchTerm("")
    setSelectedColors([])
    setSelectedCollectionIds([])
    setPriceMin("")
    setSelectedProductType("")
    setPriceMax("")
    clearAllFilters()
  }, [clearAllFilters])

  return (
    <div className="rounded-lg border bg-white p-4 flex-1">
      <Collapsible open={open} onOpenChange={setOpen} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 id="shop-filters-heading" className="font-semibold text-sm">
            Filters
          </h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Clear
                <X className="h-3 w-3" />
              </button>
            )}

            <CollapsibleTrigger
              className="text-sm px-2 py-1 inline-flex items-center gap-2"
              aria-expanded={open}
              aria-controls="shop-filters-panel"
              aria-label={open ? "Collapse filters" : "Expand filters"}
            >
              <span className="text-xs">{open ? "Hide" : "Show"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent
          id="shop-filters-panel"
          role="region"
          aria-labelledby="shop-filters-heading"
          className="space-y-4"
        >
          {/* Search Filter */}
          <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* Price Filter */}
          <FilterSection title="Price">
            <div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="price-min"
                    className="text-xs font-medium text-gray-700 block mb-1"
                  >
                    Minimum
                  </label>
                  <input
                    id="price-min"
                    type="number"
                    min="0"
                    step="1"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    onBlur={applyFilters}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters()
                    }}
                    placeholder="$0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="price-max"
                    className="text-xs font-medium text-gray-700 block mb-1"
                  >
                    Maximum
                  </label>
                  <input
                    id="price-max"
                    type="number"
                    min="0"
                    step="1"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    onBlur={applyFilters}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters()
                    }}
                    placeholder="No limit"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Product Type Filter */}
          <FilterSection title="Product Type">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="product-type-all"
                  checked={selectedProductType === ""}
                  onCheckedChange={clearProductTypes}
                />
                <Label htmlFor="product-type-all" className="text-sm font-normal cursor-pointer">
                  All Types
                </Label>
              </div>
              {PRODUCT_TYPES.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`product-type-${type}`}
                    checked={selectedProductType === type}
                    onCheckedChange={() => toggleProductType(type)}
                  />
                  <Label
                    htmlFor={`product-type-${type}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS]}
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Collection Filter */}
          {availableCollections.length > 0 && (
            <FilterSection title="Collection">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="collection-all"
                    checked={selectedCollectionIds.length === 0}
                    onCheckedChange={clearCollections}
                  />
                  <Label htmlFor="collection-all" className="text-sm font-normal cursor-pointer">
                    All Collections
                  </Label>
                </div>
                {availableCollections.map((collection) => (
                  <div key={collection.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`collection-${collection.id}`}
                      checked={selectedCollectionIds.includes(collection.id)}
                      onCheckedChange={() => toggleCollection(collection.id)}
                    />
                    <Label
                      htmlFor={`collection-${collection.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {collection.name}
                    </Label>
                  </div>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Colors Filter */}
          {availableColorIds.length > 0 && (
            <FilterSection title="Color">
              <ColorSelector
                selectedColors={selectedColors}
                onChange={handleColorsChange}
                showLabel={false}
                compact
              />
            </FilterSection>
          )}

          <div className="gap-4 items-center">
            <Label htmlFor="collection-all" className="text-xs font-medium text-gray-700 mb-2">
              Layout
            </Label>
            <ViewToggle />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
