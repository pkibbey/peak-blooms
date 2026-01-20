"use client"

import { useCallback, useState } from "react"
import { FilterSection } from "@/components/filters/FilterSection"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ProductType } from "@/generated/enums"
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types"
import { useFilterState } from "@/lib/useFilterState"

interface ProductFiltersProps {
  productTypes: ProductType[]
}

export function ProductFilters({ productTypes }: ProductFiltersProps) {
  const { searchParams, navigateWithParams, getParamsWithFilters, clearAllFilters } =
    useFilterState({
      basePath: "/admin/products",
      searchParamNames: {},
    })

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
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(searchParams.get("types")?.split(",").filter(Boolean) || [])
  )

  const applyFilters = useCallback(
    (description: typeof filterDescription, images: typeof filterImages, types: Set<string>) => {
      const updates: Record<string, string | null> = {}

      // Set description filter
      if (description !== "all") {
        updates.filterDescription = description
      } else {
        updates.filterDescription = null
      }

      // Set image filter
      if (images !== "all") {
        updates.filterImages = images
      } else {
        updates.filterImages = null
      }

      // Set type filters
      if (types.size > 0) {
        updates.types = Array.from(types).join(",")
      } else {
        updates.types = null
      }

      const params = getParamsWithFilters(updates)
      navigateWithParams(params)
    },
    [navigateWithParams, getParamsWithFilters]
  )

  const handleClearFilters = useCallback(() => {
    setFilterDescription("all")
    setFilterImages("all")
    setSelectedTypes(new Set())
    clearAllFilters()
  }, [clearAllFilters])

  const hasActiveFilters =
    filterDescription !== "all" || filterImages !== "all" || selectedTypes.size > 0

  return (
    <div className="rounded-lg border bg-white p-4 flex-1">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Description Filter */}
        <FilterSection title="Description">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="desc-all"
                checked={filterDescription === "all"}
                onCheckedChange={() => {
                  setFilterDescription("all")
                  applyFilters("all", filterImages, selectedTypes)
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
                  applyFilters("has", filterImages, selectedTypes)
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
                  applyFilters("missing", filterImages, selectedTypes)
                }}
              />
              <Label htmlFor="desc-missing" className="text-sm font-normal cursor-pointer">
                Missing description
              </Label>
            </div>
          </div>
        </FilterSection>

        {/* Image Filter */}
        <FilterSection title="Images">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="img-all"
                checked={filterImages === "all"}
                onCheckedChange={() => {
                  setFilterImages("all")
                  applyFilters(filterDescription, "all", selectedTypes)
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
                  applyFilters(filterDescription, "has", selectedTypes)
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
                  applyFilters(filterDescription, "missing", selectedTypes)
                }}
              />
              <Label htmlFor="img-missing" className="text-sm font-normal cursor-pointer">
                Missing images
              </Label>
            </div>
          </div>
        </FilterSection>

        {/* Product Type Filter */}
        <FilterSection title="Product Type">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="type-all"
                checked={selectedTypes.size === 0}
                onCheckedChange={() => {
                  setSelectedTypes(new Set())
                  applyFilters(filterDescription, filterImages, new Set())
                }}
              />
              <Label htmlFor="type-all" className="text-sm font-normal cursor-pointer">
                All
              </Label>
            </div>
            {productTypes.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedTypes.has(type)}
                  onCheckedChange={() => {
                    const newTypes = new Set(selectedTypes)
                    if (newTypes.has(type)) {
                      newTypes.delete(type)
                    } else {
                      newTypes.add(type)
                    }
                    setSelectedTypes(newTypes)
                    applyFilters(filterDescription, filterImages, newTypes)
                  }}
                />
                <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">
                  {PRODUCT_TYPE_LABELS[type]}
                </Label>
              </div>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}
