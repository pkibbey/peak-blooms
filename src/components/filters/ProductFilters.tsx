"use client"

import { ChevronDown, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { FilterSection } from "@/components/filters/FilterSection"
import { ColorSelector } from "@/components/site/ColorSelector"
import { SearchInput } from "@/components/site/SearchInput"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Label } from "@/components/ui/label"
import type { ProductType } from "@/generated/enums"
import { PRODUCT_TYPE_LABELS, PRODUCT_TYPES } from "@/lib/product-types"
import { useFilterState } from "@/lib/useFilterState"

type ProductTypeSelectionMode = "single" | "multiple"

interface ProductFiltersProps {
  /** Base route for navigation (used as the prefix for query params updates) */
  basePath: string
  /** Whether to show the search input */
  showSearch?: boolean
  /** Whether to show price inputs */
  showPrice?: boolean
  /** Whether to show product type filters */
  showProductType?: boolean
  /** Whether product type select should allow multiple values (uses `types` param) */
  productTypeSelectionMode?: ProductTypeSelectionMode
  /** Whether to show collection filters */
  showCollections?: boolean
  availableCollections?: Array<{ id: string; name: string }>
  /** Whether to show color filters */
  showColors?: boolean
  availableColorIds?: string[]
  /** Whether to show description completeness filters */
  showDescriptionFilter?: boolean
  /** Whether to show image completeness filters */
  showImageFilter?: boolean
  /** Optional list of product types to show in the type selector */
  productTypes?: ProductType[]
  /** Optional extra content rendered at the end of the filters (e.g. view toggle) */
  children?: React.ReactNode
}

export function ProductFilters({
  basePath,
  showSearch = true,
  showPrice = false,
  showProductType = false,
  productTypeSelectionMode = "single",
  showCollections = false,
  availableCollections = [],
  showColors = false,
  availableColorIds = [],
  showDescriptionFilter = false,
  showImageFilter = false,
  productTypes = PRODUCT_TYPES,
  children,
}: ProductFiltersProps) {
  const { searchParams, navigateWithParams, getParamsWithFilters, clearAllFilters } =
    useFilterState({
      basePath,
      searchParamNames: {},
    })

  const currentSearch = searchParams.get("search") || ""
  const [searchTerm, setSearchTerm] = useState<string>(currentSearch)

  const currentPriceMin = searchParams.get("priceMin") || ""
  const currentPriceMax = searchParams.get("priceMax") || ""
  const [priceMin, setPriceMin] = useState<string>(currentPriceMin)
  const [priceMax, setPriceMax] = useState<string>(currentPriceMax)

  const currentCollectionIds = searchParams.get("collectionIds")?.split(",").filter(Boolean) || []
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>(currentCollectionIds)

  const currentColors = searchParams.get("colors")?.split(",").filter(Boolean) || []
  const [selectedColors, setSelectedColors] = useState<string[]>(currentColors)

  const currentProductType = searchParams.get("productType") || ""
  const [selectedProductType, setSelectedProductType] = useState<string>(currentProductType)

  const currentTypes = searchParams.get("types")?.split(",").filter(Boolean) || []
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set(currentTypes))

  const [filterDescription, setFilterDescription] = useState<"all" | "has" | "missing">(
    searchParams.get("filterDescription") === "has"
      ? "has"
      : searchParams.get("filterDescription") === "missing"
        ? "missing"
        : "all"
  )
  const [filterImages, setFilterImages] = useState<"all" | "has" | "missing">(
    searchParams.get("filterImages") === "has"
      ? "has"
      : searchParams.get("filterImages") === "missing"
        ? "missing"
        : "all"
  )

  // Keep local state in sync with URL params (e.g. back/forward navigation)
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "")
    setPriceMin(searchParams.get("priceMin") || "")
    setPriceMax(searchParams.get("priceMax") || "")
    setSelectedCollectionIds(searchParams.get("collectionIds")?.split(",").filter(Boolean) || [])
    setSelectedColors(searchParams.get("colors")?.split(",").filter(Boolean) || [])
    setSelectedProductType(searchParams.get("productType") || "")
    setSelectedTypes(new Set(searchParams.get("types")?.split(",").filter(Boolean) || []))
    setFilterDescription(
      searchParams.get("filterDescription") === "has"
        ? "has"
        : searchParams.get("filterDescription") === "missing"
          ? "missing"
          : "all"
    )
    setFilterImages(
      searchParams.get("filterImages") === "has"
        ? "has"
        : searchParams.get("filterImages") === "missing"
          ? "missing"
          : "all"
    )
  }, [searchParams])

  const applyFilters = useCallback(
    (overrides?: {
      priceMin?: string
      priceMax?: string
      selectedCollectionIds?: string[]
      selectedColors?: string[]
      selectedProductType?: string
      selectedTypes?: Set<string>
      filterDescription?: "all" | "has" | "missing"
      filterImages?: "all" | "has" | "missing"
    }) => {
      const priceMinVal = overrides?.priceMin ?? priceMin
      const priceMaxVal = overrides?.priceMax ?? priceMax
      const collectionIds = overrides?.selectedCollectionIds ?? selectedCollectionIds
      const colors = overrides?.selectedColors ?? selectedColors
      const productType = overrides?.selectedProductType ?? selectedProductType
      const types = overrides?.selectedTypes ?? selectedTypes
      const description = overrides?.filterDescription ?? filterDescription
      const images = overrides?.filterImages ?? filterImages

      const updates: Record<string, string | null> = {}

      if (showPrice) {
        updates.priceMin = priceMinVal ? priceMinVal : null
        updates.priceMax = priceMaxVal ? priceMaxVal : null
      }

      if (showCollections) {
        updates.collectionIds = collectionIds.length > 0 ? collectionIds.join(",") : null
      }

      if (showColors) {
        updates.colors = colors.length > 0 ? colors.join(",") : null
      }

      if (showProductType) {
        if (productTypeSelectionMode === "multiple") {
          updates.types = types.size > 0 ? Array.from(types).join(",") : null
        } else {
          updates.productType = productType ? productType : null
        }
      }

      if (showDescriptionFilter) {
        updates.filterDescription = description !== "all" ? description : null
      }

      if (showImageFilter) {
        updates.filterImages = images !== "all" ? images : null
      }

      const params = getParamsWithFilters(updates)
      navigateWithParams(params)
    },
    [
      getParamsWithFilters,
      navigateWithParams,
      priceMax,
      priceMin,
      selectedCollectionIds,
      selectedColors,
      selectedProductType,
      selectedTypes,
      showPrice,
      showCollections,
      showColors,
      showProductType,
      showDescriptionFilter,
      showImageFilter,
      productTypeSelectionMode,
      filterDescription,
      filterImages,
    ]
  )

  const handleClearFilters = useCallback(() => {
    setSearchTerm("")
    setPriceMin("")
    setPriceMax("")
    setSelectedCollectionIds([])
    setSelectedColors([])
    setSelectedProductType("")
    setSelectedTypes(new Set())
    setFilterDescription("all")
    setFilterImages("all")
    clearAllFilters()
  }, [clearAllFilters])

  const hasActiveFilters =
    (showSearch && !!searchTerm.trim()) ||
    (showPrice && (!!priceMin || !!priceMax)) ||
    (showCollections && selectedCollectionIds.length > 0) ||
    (showColors && selectedColors.length > 0) ||
    (showProductType &&
      (productTypeSelectionMode === "multiple" ? selectedTypes.size > 0 : !!selectedProductType)) ||
    (showDescriptionFilter && filterDescription !== "all") ||
    (showImageFilter && filterImages !== "all")

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

  return (
    <div className="rounded-lg border bg-white p-4 flex-1">
      <Collapsible open={open} onOpenChange={setOpen} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 id="product-filters-heading" className="font-semibold text-sm">
            Filters
          </h3>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Clear
                <X className="h-3 w-3" />
              </button>
            )}

            <CollapsibleTrigger
              className="text-sm px-2 py-1 inline-flex items-center gap-2"
              aria-expanded={open}
              aria-controls="product-filters-panel"
              aria-label={open ? "Collapse filters" : "Expand filters"}
            >
              <span className="text-xs">{open ? "Hide" : "Show"}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent
          id="product-filters-panel"
          role="region"
          aria-labelledby="product-filters-heading"
          className="space-y-4"
        >
          {showSearch && (
            <SearchInput
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              basePath={basePath}
            />
          )}

          {showPrice && (
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
                      onBlur={() => applyFilters()}
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
                      onBlur={() => applyFilters()}
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
          )}

          {showProductType && (
            <FilterSection title="Product Type">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="product-type-all"
                    checked={
                      productTypeSelectionMode === "multiple"
                        ? selectedTypes.size === 0
                        : selectedProductType === ""
                    }
                    onCheckedChange={() => {
                      if (productTypeSelectionMode === "multiple") {
                        const nextTypes = new Set<string>()
                        setSelectedTypes(nextTypes)
                        applyFilters({ selectedTypes: nextTypes })
                      } else {
                        setSelectedProductType("")
                        applyFilters({ selectedProductType: "" })
                      }
                    }}
                  />
                  <Label htmlFor="product-type-all" className="text-sm font-normal cursor-pointer">
                    All Types
                  </Label>
                </div>
                {(productTypeSelectionMode === "multiple" ? productTypes : productTypes).map(
                  (type) => (
                    <div key={type} className="flex items-center gap-2">
                      <Checkbox
                        id={`product-type-${type}`}
                        checked={
                          productTypeSelectionMode === "multiple"
                            ? selectedTypes.has(type)
                            : selectedProductType === type
                        }
                        onCheckedChange={() => {
                          if (productTypeSelectionMode === "multiple") {
                            const newTypes = new Set(selectedTypes)
                            if (newTypes.has(type)) {
                              newTypes.delete(type)
                            } else {
                              newTypes.add(type)
                            }
                            setSelectedTypes(newTypes)
                            applyFilters({ selectedTypes: newTypes })
                          } else {
                            const nextType = selectedProductType === type ? "" : type
                            setSelectedProductType(nextType)
                            applyFilters({ selectedProductType: nextType })
                          }
                        }}
                      />
                      <Label
                        htmlFor={`product-type-${type}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {PRODUCT_TYPE_LABELS[type as keyof typeof PRODUCT_TYPE_LABELS]}
                      </Label>
                    </div>
                  )
                )}
              </div>
            </FilterSection>
          )}

          {showDescriptionFilter && (
            <FilterSection title="Description">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="desc-all"
                    checked={filterDescription === "all"}
                    onCheckedChange={() => {
                      setFilterDescription("all")
                      applyFilters({ filterDescription: "all" })
                    }}
                  />
                  <Label htmlFor="desc-all" className="text-sm font-normal cursor-pointer">
                    All
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="desc-has"
                    checked={filterDescription === "has"}
                    onCheckedChange={() => {
                      setFilterDescription("has")
                      applyFilters({ filterDescription: "has" })
                    }}
                  />
                  <Label htmlFor="desc-has" className="text-sm font-normal cursor-pointer">
                    Has description
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="desc-missing"
                    checked={filterDescription === "missing"}
                    onCheckedChange={() => {
                      setFilterDescription("missing")
                      applyFilters({ filterDescription: "missing" })
                    }}
                  />
                  <Label htmlFor="desc-missing" className="text-sm font-normal cursor-pointer">
                    Missing description
                  </Label>
                </div>
              </div>
            </FilterSection>
          )}

          {showImageFilter && (
            <FilterSection title="Images">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="img-all"
                    checked={filterImages === "all"}
                    onCheckedChange={() => {
                      setFilterImages("all")
                      applyFilters({ filterImages: "all" })
                    }}
                  />
                  <Label htmlFor="img-all" className="text-sm font-normal cursor-pointer">
                    All
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="img-has"
                    checked={filterImages === "has"}
                    onCheckedChange={() => {
                      setFilterImages("has")
                      applyFilters({ filterImages: "has" })
                    }}
                  />
                  <Label htmlFor="img-has" className="text-sm font-normal cursor-pointer">
                    Has images
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="img-missing"
                    checked={filterImages === "missing"}
                    onCheckedChange={() => {
                      setFilterImages("missing")
                      applyFilters({ filterImages: "missing" })
                    }}
                  />
                  <Label htmlFor="img-missing" className="text-sm font-normal cursor-pointer">
                    Missing images
                  </Label>
                </div>
              </div>
            </FilterSection>
          )}

          {showCollections && (
            <FilterSection title="Collection">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="collection-all"
                    checked={selectedCollectionIds.length === 0}
                    onCheckedChange={() => {
                      const nextIds: string[] = []
                      setSelectedCollectionIds(nextIds)
                      applyFilters({ selectedCollectionIds: nextIds })
                    }}
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
                      onCheckedChange={() => {
                        const newCollectionIds = selectedCollectionIds.includes(collection.id)
                          ? selectedCollectionIds.filter((id) => id !== collection.id)
                          : [...selectedCollectionIds, collection.id]
                        setSelectedCollectionIds(newCollectionIds)
                        applyFilters({ selectedCollectionIds: newCollectionIds })
                      }}
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

          {showColors && (
            <FilterSection title="Color">
              <ColorSelector
                selectedColors={selectedColors}
                onChange={(colors) => {
                  setSelectedColors(colors)
                  applyFilters({ selectedColors: colors })
                }}
                showLabel={false}
                compact
                colorIds={availableColorIds}
              />
            </FilterSection>
          )}

          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
