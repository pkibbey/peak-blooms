"use client"

import { ExternalLink, FileText, Trash } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"
import { deleteOrderAttachmentAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import { toAppErrorClient } from "@/lib/error-utils"
import { cn } from "@/lib/utils"

type Attachment = {
  id: string
  url: string
  mime?: string
  size?: number | null
  createdAt: string | Date
}

interface OrderAttachmentsListProps {
  attachments: Attachment[]
}

function formatSize(size?: number | null) {
  if (!size) return ""
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round((size / 1024) * 10) / 10} KB`
  return `${Math.round((size / (1024 * 1024)) * 10) / 10} MB`
}

export function OrderAttachmentsList({ attachments }: OrderAttachmentsListProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleDelete = (attachmentId: string) => {
    startTransition(async () => {
      try {
        const res = await deleteOrderAttachmentAction({ attachmentId })
        if (!res || !res.success) {
          toast.error(res?.error || "Failed to delete attachment")
          return
        }

        toast.success("Attachment deleted")
        router.refresh()
      } catch (err) {
        toAppErrorClient(err, "Failed to delete attachment")
      }
    })
  }

  if (!attachments || attachments.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No attachments</p>
  }

  // sort attachments newest-first (defensive; server also returns ordered attachments)
  const sorted = [...attachments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <div className="space-y-2">
      {sorted.map((att, index) => (
        <div
          key={att.id}
          className={cn(
            "flex items-center justify-between gap-3 p-2 border rounded-md",
            index === 0 ? "opacity-100" : "opacity-45 hover:opacity-100"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-sm bg-muted p-2">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline block truncate"
              >
                Invoice {new Date(att.createdAt).toLocaleString()}
              </a>
              <div className="text-xs text-muted-foreground">{formatSize(att.size)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              render={() => (
                <a href={att.url} target="_blank" rel="noreferrer" aria-label="Open attachment">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            ></Button>

            <Button
              size="sm"
              variant="outline-destructive"
              onClick={() => handleDelete(att.id)}
              disabled={isPending}
              aria-label="Delete attachment"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
