"use client"

import { ChevronDown, Filter, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import { ColorSelector } from "@/components/site/ColorSelector"
import { SearchInput } from "@/components/site/SearchInput"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

interface ShopFiltersProps {
  availableColorIds?: string[]
  availableCollections?: Array<{ id: string; name: string }>
}

export function ShopFilters({
  availableColorIds = [],
  availableCollections = [],
}: ShopFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)

  // Parse current filter state from URL
  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) || []
  const currentCollectionId = searchParams.get("collectionId") || ""
  const currentStemLengthMin = searchParams.get("stemLengthMin") || ""
  const currentStemLengthMax = searchParams.get("stemLengthMax") || ""
  const currentPriceMin = searchParams.get("priceMin") || ""
  const currentPriceMax = searchParams.get("priceMax") || ""

  // Local state for filters
  const [selectedColors, setSelectedColors] = useState<string[]>(currentColors)
  const [selectedCollection, setSelectedCollection] = useState<string>(currentCollectionId)
  const [stemLengthMin, setStemLengthMin] = useState<string>(currentStemLengthMin)
  const [stemLengthMax, setStemLengthMax] = useState<string>(currentStemLengthMax)
  const [priceMin, setPriceMin] = useState<string>(currentPriceMin)
  const [priceMax, setPriceMax] = useState<string>(currentPriceMax)

  // Count active filters
  const activeFilterCount = [
    ...selectedColors,
    selectedCollection ? 1 : 0,
    stemLengthMin ? 1 : 0,
    stemLengthMax ? 1 : 0,
    priceMin ? 1 : 0,
    priceMax ? 1 : 0,
  ].filter(Boolean).length

  // Helper to build and navigate to filter URL
  const navigateWithFilters = useCallback(
    (
      colors: string[],
      collection: string,
      stemMin: string,
      stemMax: string,
      priceMinVal: string,
      priceMaxVal: string
    ) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("page", "1")

      if (colors.length > 0) {
        params.set("colors", colors.join(","))
      } else {
        params.delete("colors")
      }

      if (collection) {
        params.set("collectionId", collection)
      } else {
        params.delete("collectionId")
      }

      if (stemMin) {
        params.set("stemLengthMin", stemMin)
      } else {
        params.delete("stemLengthMin")
      }

      if (stemMax) {
        params.set("stemLengthMax", stemMax)
      } else {
        params.delete("stemLengthMax")
      }

      if (priceMinVal) {
        params.set("priceMin", priceMinVal)
      } else {
        params.delete("priceMin")
      }

      if (priceMaxVal) {
        params.set("priceMax", priceMaxVal)
      } else {
        params.delete("priceMax")
      }

      router.push(`/shop?${params.toString()}`, { scroll: false })
    },
    [searchParams, router]
  )

  // Handle color changes — apply instantly
  const handleColorsChange = useCallback(
    (colors: string[]) => {
      setSelectedColors(colors)
      navigateWithFilters(
        colors,
        selectedCollection,
        stemLengthMin,
        stemLengthMax,
        priceMin,
        priceMax
      )
      setIsOpen(false)
    },
    [selectedCollection, stemLengthMin, stemLengthMax, priceMin, priceMax, navigateWithFilters]
  )

  // Handle collection toggle — apply instantly
  const toggleCollection = useCallback(
    (collectionId: string) => {
      const newCollection = selectedCollection === collectionId ? "" : collectionId
      setSelectedCollection(newCollection)
      navigateWithFilters(
        selectedColors,
        newCollection,
        stemLengthMin,
        stemLengthMax,
        priceMin,
        priceMax
      )
      setIsOpen(false)
    },
    [
      selectedColors,
      selectedCollection,
      stemLengthMin,
      stemLengthMax,
      priceMin,
      priceMax,
      navigateWithFilters,
    ]
  )

  // Clear collection (select "All Collections")
  const clearCollection = useCallback(() => {
    setSelectedCollection("")
    navigateWithFilters(selectedColors, "", stemLengthMin, stemLengthMax, priceMin, priceMax)
  }, [selectedColors, stemLengthMin, stemLengthMax, priceMin, priceMax, navigateWithFilters])

  // Apply filters for numeric inputs (blur/Enter)
  const applyFilters = useCallback(() => {
    navigateWithFilters(
      selectedColors,
      selectedCollection,
      stemLengthMin,
      stemLengthMax,
      priceMin,
      priceMax
    )
    setIsOpen(false)
  }, [
    selectedColors,
    selectedCollection,
    stemLengthMin,
    stemLengthMax,
    priceMin,
    priceMax,
    navigateWithFilters,
  ])

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedColors([])
    setSelectedCollection("")
    setStemLengthMin("")
    setStemLengthMax("")
    setPriceMin("")
    setPriceMax("")
    router.push("/shop?page=1", { scroll: false })
    setIsOpen(false)
  }, [router])

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)} className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <button
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
          type="button"
          aria-label="Close filters"
        />
      )}

      {/* Filter Panel */}
      <div
        className={cn(
          "fixed left-0 top-0 bottom-0 w-72 bg-white shadow-lg transition-transform lg:static lg:shadow-none lg:w-auto lg:bg-transparent p-4 lg:p-0 z-50 lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header with close button (mobile only) */}
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <h2 className="font-semibold text-lg">Filters</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Search Filter */}
          <SearchInput />

          {/* Colors Filter */}
          {availableColorIds.length > 0 && (
            <FilterSection title="Color">
              <ColorSelector
                selectedColors={selectedColors}
                onChange={handleColorsChange}
                showLabel={false}
                compact={true}
              />
            </FilterSection>
          )}

          {/* Collection Filter */}
          {availableCollections.length > 0 && (
            <FilterSection title="Collection">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="collection-all"
                    checked={!selectedCollection}
                    onChange={clearCollection}
                  />
                  <label htmlFor="collection-all" className="text-sm cursor-pointer">
                    All Collections
                  </label>
                </div>
                {availableCollections.map((collection) => (
                  <div key={collection.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`collection-${collection.id}`}
                      checked={selectedCollection === collection.id}
                      onChange={() => toggleCollection(collection.id)}
                    />
                    <label
                      htmlFor={`collection-${collection.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {collection.name}
                    </label>
                  </div>
                ))}
              </div>
            </FilterSection>
          )}

          {/* Stem Length Filter */}
          <FilterSection title="Stem Length (inches)">
            <div className="space-y-4">
              <div>
                <label htmlFor="stem-length-min" className="text-sm font-medium block mb-1">
                  Minimum
                </label>
                <input
                  id="stem-length-min"
                  type="number"
                  min="0"
                  value={stemLengthMin}
                  onChange={(e) => setStemLengthMin(e.target.value)}
                  onBlur={applyFilters}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyFilters()
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label htmlFor="stem-length-max" className="text-sm font-medium block mb-1">
                  Maximum
                </label>
                <input
                  id="stem-length-max"
                  type="number"
                  min="0"
                  value={stemLengthMax}
                  onChange={(e) => setStemLengthMax(e.target.value)}
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

          {/* Price Filter */}
          <FilterSection title="Price">
            <div className="space-y-4">
              <div>
                <label htmlFor="price-min" className="text-sm font-medium block mb-1">
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
                <label htmlFor="price-max" className="text-sm font-medium block mb-1">
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

          {/* Action Buttons */}
          {activeFilterCount > 0 && (
            <Button onClick={clearFilters} variant="outline" className="w-full">
              Reset filters
            </Button>
          )}
        </div>
      </div>
    </>
  )
}

// Collapsible Filter Section Component
interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = false }: FilterSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b pb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full group py-2 hover:text-gray-700"
        aria-expanded={open}
      >
        <h3 className="font-semibold text-sm">{title}</h3>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="pt-3">{children}</div>}
    </div>
  )
}
