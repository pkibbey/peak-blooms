import Image from "next/image"
import Link from "next/link"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Collection {
  id: string
  name: string
  slug: string
  image: string | null
  _count?: {
    products: number
  }
}

interface CollectionsTableProps {
  collections: Collection[]
  sort?: string | null
  order?: "asc" | "desc" | null
}

const headerUrl = "/admin/collections"

export default function CollectionsTable({ collections, sort, order }: CollectionsTableProps) {
  if (collections.length === 0) {
    return (
      <p className="text-muted-foreground">
        No collections found. Add your first collection to get started.
      </p>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
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
          {collections.map((collection) => (
            <TableRow key={collection.id}>
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
                {collection._count?.products || 0}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
