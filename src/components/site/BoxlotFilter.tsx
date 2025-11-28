"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { IconPackage } from "@/components/ui/icons"

export function BoxlotFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isBoxlotOnly = searchParams.get("boxlotOnly") === "true"

  const toggleBoxlotFilter = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (isBoxlotOnly) {
      params.delete("boxlotOnly")
    } else {
      params.set("boxlotOnly", "true")
    }
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <Button
      variant={isBoxlotOnly ? "default" : "outline"}
      onClick={toggleBoxlotFilter}
      className="gap-2"
    >
      <IconPackage className="h-4 w-4" />
      {isBoxlotOnly ? "Showing Boxlots" : "Boxlots Only"}
    </Button>
  )
}
