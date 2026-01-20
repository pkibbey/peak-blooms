"use client"

import { X } from "lucide-react"
import { useCallback, useState } from "react"
import { FilterSection } from "@/components/filters/FilterSection"
import { ColorSelector } from "@/components/site/ColorSelector"
import { SearchInput } from "@/components/site/SearchInput"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useFilterState } from "@/lib/useFilterState"

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

  // Parse current filter state from URL
  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) || []
  const currentCollectionIds = searchParams.get("collectionIds")?.split(",").filter(Boolean) || []
  const currentPriceMin = searchParams.get("priceMin") || ""
  const currentPriceMax = searchParams.get("priceMax") || ""

  // Local state for filters
  const [selectedColors, setSelectedColors] = useState<string[]>(currentColors)
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(currentCollectionIds)
  const [priceMin, setPriceMin] = useState<string>(currentPriceMin)
  const [priceMax, setPriceMax] = useState<string>(currentPriceMax)

  // Check if any filters are active
  const hasActiveFilters =
    selectedColors.length > 0 || selectedCollectionIds.length > 0 || !!priceMin || !!priceMax

  // Helper to update all filters at once
  const updateFilters = useCallback(
    (colors: string[], collectionIds: string[], priceMinVal: string, priceMaxVal: string) => {
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

      const params = getParamsWithFilters(updates)
      navigateWithParams(params)
    },
    [navigateWithParams, getParamsWithFilters]
  )

  // Handle color changes - apply instantly
  const handleColorsChange = useCallback(
    (colors: string[]) => {
      setSelectedColors(colors)
      updateFilters(colors, selectedCollectionIds, priceMin, priceMax)
    },
    [selectedCollectionIds, priceMin, priceMax, updateFilters]
  )

  // Handle collection toggle - add/remove from selection
  const toggleCollection = useCallback(
    (collectionId: string) => {
      const newCollectionIds = selectedCollectionIds.includes(collectionId)
        ? selectedCollectionIds.filter((id) => id !== collectionId)
        : [...selectedCollectionIds, collectionId]
      setSelectedCollectionIds(newCollectionIds)
      updateFilters(selectedColors, newCollectionIds, priceMin, priceMax)
    },
    [selectedColors, selectedCollectionIds, priceMin, priceMax, updateFilters]
  )

  // Clear all collections
  const clearCollections = useCallback(() => {
    setSelectedCollectionIds([])
    updateFilters(selectedColors, [], priceMin, priceMax)
  }, [selectedColors, priceMin, priceMax, updateFilters])

  // Apply filters for numeric inputs (blur/Enter)
  const applyFilters = useCallback(() => {
    updateFilters(selectedColors, selectedCollectionIds, priceMin, priceMax)
  }, [selectedColors, selectedCollectionIds, priceMin, priceMax, updateFilters])

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSelectedColors([])
    setSelectedCollectionIds([])
    setPriceMin("")
    setPriceMax("")
    clearAllFilters()
  }, [clearAllFilters])

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAllFilters}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Search Filter */}
        <SearchInput />

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

        {/* Price Filter */}
        <FilterSection title="Price">
          <div className="space-y-3">
            <div>
              <label htmlFor="price-min" className="text-xs font-medium block mb-1">
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
              <label htmlFor="price-max" className="text-xs font-medium block mb-1">
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
        </FilterSection>
      </div>
    </div>
  )
}
