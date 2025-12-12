"use client"

import { Search, X } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { SearchResultsCommand } from "@/components/site/SearchResultsCommand"
import { Popover } from "@/components/ui/popover"
import { useDebouncedCallback } from "@/lib/useDebouncedCallback"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  compact?: boolean
  className?: string
}

export function SearchInput({ compact = false, className }: SearchInputProps) {
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("search") || ""
  const [searchTerm, setSearchTerm] = useState<string>(currentSearch)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Debounced search handler for popover display (desktop)
  const handleSearch = useDebouncedCallback((term: unknown) => {
    const termStr = typeof term === "string" ? term : ""
    setSearchTerm(termStr)
    if (compact && termStr.trim()) {
      setIsPopoverOpen(true)
    }
  }, 300)

  const onInputChange = (value: string) => {
    setSearchTerm(value)
    handleSearch(value)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setIsPopoverOpen(false)
  }

  if (compact) {
    return (
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <div className={cn("relative w-48", className)}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search products"
            value={searchTerm}
            onChange={(e) => onInputChange(e.target.value)}
            onFocus={() => searchTerm.trim() && setIsPopoverOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                if (!isPopoverOpen) setIsPopoverOpen(true)
                setTimeout(() => {
                  const el = document.getElementById("search-result-0") as HTMLElement | null
                  if (el) el.focus()
                }, 0)
              }
            }}
            className={cn(
              "w-full pl-9 pr-8 py-2 rounded-md border border-input bg-background/50",
              "placeholder:text-muted-foreground text-sm",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0",
              "transition-all"
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
        <SearchResultsCommand
          searchTerm={searchTerm}
          isOpen={isPopoverOpen}
          onClose={() => setIsPopoverOpen(false)}
        />
      </Popover>
    )
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
