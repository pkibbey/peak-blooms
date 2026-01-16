import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CollectionBasicWithCount } from "@/lib/types/collections"
import CollectionsTableRow from "./CollectionsTableRow"

interface CollectionsTableProps {
  collections: CollectionBasicWithCount[]
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
            <TableHead>Featured</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {collections.map((collection) => (
            <CollectionsTableRow key={collection.id} collection={collection} />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
