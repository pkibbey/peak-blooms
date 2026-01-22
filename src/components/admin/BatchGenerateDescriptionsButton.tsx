"use client"

import { LoaderCircle, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { batchGenerateDescriptionsAction } from "@/app/admin/products/actions"
import { Button } from "@/components/ui/button"
import { toAppErrorClient } from "@/lib/error-utils"

interface ProductFilters {
  filterDescription?: "has" | "missing"
  filterImages?: "has" | "missing"
  types?: string[]
}

interface BatchGenerateDescriptionsButtonProps {
  remainingCount: number
  filters?: ProductFilters
}

const BATCH_COUNT = 10

export function BatchGenerateDescriptionsButton({
  remainingCount,
  filters,
}: BatchGenerateDescriptionsButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const totalToGenerate = remainingCount < BATCH_COUNT ? remainingCount : BATCH_COUNT

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
        toAppErrorClient(error, "Failed to generate description")
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
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Next {totalToGenerate} Description{totalToGenerate !== 1 && "s"}
        </>
      )}
    </Button>
  )
}
