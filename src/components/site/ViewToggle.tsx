"use client"

import { Grid3X3, Table2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"

interface ViewToggleProps {
  defaultView?: "grid" | "table"
}

export function ViewToggle({ defaultView = "grid" }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewMode = searchParams.get("view") || defaultView

  const isTableView = viewMode === "table"

  const setGridView = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("view")
    router.push(`/shop?${params.toString()}`, { scroll: false })
  }

  const setTableView = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", "table")
    router.push(`/shop?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant={!isTableView ? "default" : "outline"}
        size="sm"
        onClick={setGridView}
        aria-label="Grid view"
        className="px-3"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={isTableView ? "default" : "outline"}
        size="sm"
        onClick={setTableView}
        aria-label="Table view"
        className="px-3"
      >
        <Table2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
