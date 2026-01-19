"use client"

import { Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { batchGenerateDescriptionsAction } from "@/app/admin/products/actions"
import { Button } from "@/components/ui/button"
import { IconRefresh } from "@/components/ui/icons"

interface ProductFilters {
  filterDescription?: "has" | "missing"
  filterImages?: "has" | "missing"
  productType?: string
}

interface BatchGenerateDescriptionsButtonProps {
  remainingCount: number
  filters?: ProductFilters
}

export function BatchGenerateDescriptionsButton({
  remainingCount,
  filters,
}: BatchGenerateDescriptionsButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const totalToGenerate = remainingCount < 10 ? remainingCount : 10

  const handleBatchGenerate = () => {
    if (remainingCount === 0) return

    startTransition(async () => {
      try {
        const result = await batchGenerateDescriptionsAction(filters)

        if (result.success) {
          toast.success(
            `Generated ${result.successCount} descriptions${result.failureCount > 0 ? `, ${result.failureCount} failed` : ""}`
          )

          // Refresh the page to show updated products and new count
          router.refresh()
        } else {
          toast.error("Batch generation failed")
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An error occurred"
        toast.error(errorMessage)
      }
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleBatchGenerate}
      disabled={isPending || remainingCount === 0}
      title={remainingCount === 0 ? "All products have descriptions" : undefined}
    >
      {isPending ? (
        <>
          <IconRefresh className="mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Next {totalToGenerate} Description{totalToGenerate !== 1 && "s"}
        </>
      )}
    </Button>
  )
}
