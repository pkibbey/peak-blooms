"use client"

import { Grid3X3, LoaderCircle, Table2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"

interface ViewToggleProps {
  defaultView?: "grid" | "table"
}

export function ViewToggle({ defaultView = "grid" }: ViewToggleProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const viewMode = searchParams.get("view") || defaultView

  const [isPending, startTransition] = useTransition()

  const isTableView = viewMode === "table"

  const setGridView = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("view")
    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false })
    })
  }

  const setTableView = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("view", "table")
    startTransition(() => {
      router.push(`/shop?${params.toString()}`, { scroll: false })
    })
  }

  return (
    <div className="flex gap-2 items-center">
      <Button
        variant={!isTableView ? "default" : "outline"}
        size="sm"
        onClick={setGridView}
        aria-label="Grid view"
        className="px-3"
        disabled={isPending}
        aria-busy={isPending}
      >
        <span className="inline-flex items-center">
          {isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Grid3X3 className="h-4 w-4" />
          )}
        </span>
      </Button>
      <Button
        variant={isTableView ? "default" : "outline"}
        size="sm"
        onClick={setTableView}
        aria-label="Table view"
        className="px-3"
        disabled={isPending}
        aria-busy={isPending}
      >
        <span className="inline-flex items-center">
          {isPending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Table2 className="h-4 w-4" />
          )}
        </span>
      </Button>
    </div>
  )
}
