"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { IconPackage } from "@/components/ui/icons"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export function BoxlotFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBoxlotOnly = searchParams.get("boxlotOnly") === "true"

  const toggleBoxlotFilter = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set("boxlotOnly", "true")
    } else {
      params.delete("boxlotOnly")
    }
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        id="boxlot-filter"
        checked={isBoxlotOnly}
        onCheckedChange={toggleBoxlotFilter}
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
