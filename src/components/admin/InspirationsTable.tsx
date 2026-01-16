import Image from "next/image"
import Link from "next/link"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table"
import type { InspirationWithCount } from "@/lib/types/inspirations"

interface InspirationsTableProps {
  inspirations: InspirationWithCount[]
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
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {inspirations.map((inspiration) => {
            const productCount = inspiration._count?.products || 0

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
                    prefetch={false}
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

                {/* Products Count */}
                <TableCell className="text-muted-foreground">{productCount}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
