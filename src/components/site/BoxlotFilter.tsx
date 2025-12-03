"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { IconPackage } from "@/components/ui/icons"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function BoxlotFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBoxlotOnly = searchParams.get("boxlotOnly") === "true"

  // Keep the page param within valid range when filters reduce result size.
  const [isCounting, setIsCounting] = useState(false)
  const ITEMS_PER_PAGE = 12 // must match /src/app/shop/page.tsx

  const toggleBoxlotFilter = async (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())

    if (checked) {
      params.set("boxlotOnly", "true")
    } else {
      params.delete("boxlotOnly")
    }

    // If the user is currently on a high page and the new filtered set is smaller
    // we should clamp the page to the highest available page for the new filter.
    setIsCounting(true)
    try {
      // Ask the API for a light-weight count by requesting a single item.
      const q = new URLSearchParams(params.toString())
      q.set("limit", "1")
      q.set("offset", "0")

      const res = await fetch(`/api/products?${q.toString()}`, { cache: "no-store" })
      if (!res.ok) {
        // If the count failed, fall back to the simple push (don't block UX)
        router.push(`/shop?${params.toString()}`)
        return
      }

      const data = await res.json()
      const total = Number(data?.total ?? 0)
      const maxPage = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))

      const currentPage = Number(searchParams.get("page") ?? 1)
      if (currentPage > maxPage) {
        params.set("page", String(maxPage))
      }

      router.push(`/shop?${params.toString()}`)
    } catch {
      // network or unexpected error — don't block toggle, fallback to pushing new params
      router.push(`/shop?${params.toString()}`)
    } finally {
      setIsCounting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="boxlot-filter"
        checked={isBoxlotOnly}
        onCheckedChange={toggleBoxlotFilter}
        disabled={isCounting}
        aria-busy={isCounting}
      />
      <Label
        htmlFor="boxlot-filter"
        className="flex items-center gap-2 cursor-pointer text-sm font-medium"
      >
        <IconPackage className="h-4 w-4 text-amber-600" />
        Bulk Boxlots Only
      </Label>
    </div>
  )
}
