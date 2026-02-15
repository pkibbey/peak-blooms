"use client"

import { LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { generateInvoiceAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { toAppErrorClient } from "@/lib/error-utils"

interface GenerateInvoiceButtonProps {
  orderId: string
}

export function GenerateInvoiceButton({ orderId }: GenerateInvoiceButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const res = await generateInvoiceAction({ orderId })
        if (!res || !res.success) {
          toast.error(res?.error || "Failed to generate invoice")
          return
        }

        toast.success("Invoice generated")
        router.refresh()
      } catch (err) {
        toAppErrorClient(err, "Failed to generate invoice")
      }
    })
  }

  return (
    <Button onClick={handleGenerate} size="sm" type="button" disabled={isPending}>
      {isPending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
          Generating...
        </>
      ) : (
        "Generate new invoice for current order"
      )}
    </Button>
  )
}
