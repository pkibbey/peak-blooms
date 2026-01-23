import Image from "next/image"
import Link from "next/link"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import type { InspirationBasic } from "@/lib/query-types"

// Allow optional product previews to be passed (first few products with images)
type InspirationRow = InspirationBasic & {
  products?: { product: { id: string; name?: string; images: string[] } }[]
}

interface InspirationsTableProps {
  inspirations: InspirationRow[]
  sort?: string | null
  order?: "asc" | "desc" | null
}

const headerUrl = "/admin/inspirations"

export default function InspirationsTable({ inspirations, sort, order }: InspirationsTableProps) {
  if (inspirations.length === 0) {
    return (
      <p className="text-muted-foreground">
        No inspirations found. Add your first inspiration to get started.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableTableHead
              label="Image"
              sortKey="image"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
            <SortableTableHead
              label="Name"
              sortKey="name"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
            <SortableTableHead
              label="Slug"
              sortKey="slug"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden md:table-cell"
            />
            <SortableTableHead
              label="Products"
              sortKey="products"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden sm:table-cell"
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspirations.map((inspiration) => {
            const productCount = inspiration._count?.products || 0
            const productPreviews = inspiration.products ?? []

            return (
              <TableRow key={inspiration.id}>
                {/* Image */}
                <TableCell>
                  <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-muted">
                    {inspiration.image ? (
                      <Image
                        src={inspiration.image}
                        alt={inspiration.name}
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
                    href={`/admin/inspirations/${inspiration.id}/edit`}
                    className="text-primary font-medium hover:underline"
                  >
                    {inspiration.name}
                  </Link>
                </TableCell>

                {/* Slug */}
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  /{inspiration.slug}
                </TableCell>

                {/* Products */}
                <TableCell className="hidden sm:table-cell">
                  {productPreviews.length === 0 ? (
                    <div className="text-muted-foreground">—</div>
                  ) : (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {productPreviews.map((p) => (
                          <div
                            key={p.product.id}
                            className="relative h-6 w-6 overflow-hidden rounded-sm ring-1 ring-border"
                          >
                            {p.product.images?.[0] ? (
                              <Image
                                src={p.product.images[0]}
                                alt={p.product.name ?? ""}
                                fill
                                className="object-cover"
                                sizes="24px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                —
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {productCount > productPreviews.length && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          +{productCount - productPreviews.length}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
