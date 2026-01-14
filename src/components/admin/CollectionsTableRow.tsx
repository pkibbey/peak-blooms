"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { toggleCollectionFeaturedAction } from "@/app/actions/collections"
import { Checkbox } from "@/components/ui/checkbox"
import { TableCell, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface Collection {
  id: string
  name: string
  slug: string
  image: string | null
  featured: boolean
  _count?: {
    productCollections: number
  }
}

export default function CollectionsTableRow({ collection }: { collection: Collection }) {
  const router = useRouter()
  const [featured, setFeatured] = useState<boolean>(!!collection.featured)
  const [isPending, startTransition] = useTransition()

  return (
    <TableRow key={collection.id} className={cn(collection.featured && "bg-blue-300/10")}>
      {/* Image */}
      <TableCell>
        <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
          {collection.image ? (
            <Image
              src={collection.image}
              alt={collection.name}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              —
            </div>
          )}
        </div>
      </TableCell>

      {/* Name */}
      <TableCell>
        <Link
          prefetch={false}
          href={`/admin/collections/${collection.id}/edit`}
          className="text-primary font-medium hover:underline"
        >
          {collection.name}
        </Link>
      </TableCell>

      {/* Slug */}
      <TableCell className="hidden md:table-cell text-muted-foreground">
        /{collection.slug}
      </TableCell>

      {/* Products Count */}
      <TableCell className="text-muted-foreground">
        {collection._count?.productCollections || 0}
      </TableCell>

      {/* Featured */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!featured}
            onCheckedChange={(value) => {
              const previous = featured
              setFeatured(value)

              startTransition(async () => {
                try {
                  await toggleCollectionFeaturedAction({ id: collection.id, featured: value })
                  toast.success(
                    `${value ? "Marked featured" : "Removed featured"} - ${collection.name}`
                  )
                  router.refresh()
                } catch (err) {
                  setFeatured(previous)
                  toast.error(err instanceof Error ? err.message : "Failed to update collection")
                }
              })
            }}
            disabled={isPending}
            aria-label={`Toggle featured for ${collection.name}`}
          />
        </div>
      </TableCell>
    </TableRow>
  )
}
