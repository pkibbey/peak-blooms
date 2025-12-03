"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface ViewToggleProps {
  defaultView?: "grid" | "table"
}

export function ViewToggle({ defaultView = "grid" }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewMode = searchParams.get("view") || defaultView

  const isTableView = viewMode === "table"

  const toggleView = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set("view", "table")
    } else {
      params.delete("view")
    }
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="view-toggle" className="text-sm font-medium cursor-pointer">
        {isTableView ? "Table View" : "Grid View"}
      </Label>
      <Switch
        id="view-toggle"
        checked={isTableView}
        onCheckedChange={toggleView}
        aria-label="Toggle between grid and table view"
      />
    </div>
  )
}
