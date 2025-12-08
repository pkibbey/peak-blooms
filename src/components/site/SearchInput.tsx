"use client"

import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { cn } from "@/lib/utils"

export function SearchInput() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("search") || ""
  const [searchTerm, setSearchTerm] = useState<string>(currentSearch)

  // Debounced search handler to avoid excessive URL updates while typing
  const handleSearch = useDebouncedCallback((term: unknown) => {
    const termStr = typeof term === "string" ? term : ""
    const params = new URLSearchParams(searchParams.toString())

    if (termStr.trim()) {
      params.set("search", termStr.trim())
    } else {
      params.delete("search")
    }

    // Reset to page 1 when search changes
    params.set("page", "1")

    router.push(`/shop?${params.toString()}`, { scroll: false })
  }, 300)

  const onInputChange = (value: string) => {
    setSearchTerm(value)
    handleSearch(value)
  }

  const clearSearch = () => {
    setSearchTerm("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("search")
    params.set("page", "1")
    router.push(`/shop?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="mb-6">
      <label htmlFor="search" className="text-sm font-medium mb-2 block">
        Search
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          id="search"
          type="text"
          placeholder="Search by name or description"
          value={searchTerm}
          onChange={(e) => onInputChange(e.target.value)}
          className={cn(
            "w-full pl-9 pr-3 py-2 rounded-md border border-input bg-background",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
            "text-sm"
          )}
          aria-label="Search products"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
