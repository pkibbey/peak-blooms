"use client"

import { Search, X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"

export function SearchInput() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentSearch = searchParams.get("search") || ""
  const [searchTerm, setSearchTerm] = useState<string>(currentSearch)

  // Debounced search handler for popover display (desktop)
  const handleSearch = useDebouncedCallback((term: unknown) => {
    const termStr = typeof term === "string" ? term : ""
    setSearchTerm(termStr)
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
      <Label htmlFor="search" className="text-xs font-medium text-gray-700 mb-2 block">
        Search
      </Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id="search"
          type="text"
          placeholder="Search by keyword"
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
          <Button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
            type="button"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
