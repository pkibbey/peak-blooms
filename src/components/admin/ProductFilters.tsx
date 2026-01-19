"use client"

import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { ProductType } from "@/generated/enums"
import { PRODUCT_TYPE_LABELS } from "@/lib/product-types"

interface ProductFiltersProps {
  productTypes: ProductType[]
}

export function ProductFilters({ productTypes }: ProductFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

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

  const applyFilters = (
    description: typeof filterDescription,
    images: typeof filterImages,
    types: Set<string>
  ) => {
    const params = new URLSearchParams(searchParams.toString())

    // Set description filter
    if (description !== "all") {
      params.set("filterDescription", description)
    } else {
      params.delete("filterDescription")
    }

    // Set image filter
    if (images !== "all") {
      params.set("filterImages", images)
    } else {
      params.delete("filterImages")
    }

    // Set type filters
    if (types.size > 0) {
      params.set("types", Array.from(types).join(","))
    } else {
      params.delete("types")
    }

    // Reset to page 1 when filters change
    params.delete("page")

    router.push(`/admin/products?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setFilterDescription("all")
    setFilterImages("all")
    setSelectedTypes(new Set())
    router.push("/admin/products")
  }

  const hasActiveFilters =
    filterDescription !== "all" || filterImages !== "all" || selectedTypes.size > 0

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-sm">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Description Filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Description</p>
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
        </div>

        {/* Image Filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Images</p>
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
        </div>

        {/* Product Type Filter */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Product Type</p>
          <div className="space-y-2">
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
        </div>
      </div>
    </div>
  )
}
