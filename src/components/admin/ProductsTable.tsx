import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductWithCollections } from "@/lib/query-types"
import ProductsTableRow from "./ProductsTableRow"

interface ProductsTableProps {
  products: ProductWithCollections[]
  sort?: string | null
  order?: "asc" | "desc" | null
  headerUrl: string
}

export default function ProductsTable({ products, sort, order, headerUrl }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground">
        No products found. Add your first product to get started.
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
              label="Price"
              sortKey="price"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden lg:table-cell"
            />
            <TableHead>Colors</TableHead>
            <SortableTableHead
              label="Description"
              sortKey="description"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden lg:table-cell"
            />
            <SortableTableHead
              label="Featured"
              sortKey="featured"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
            />
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductsTableRow key={product.id} product={product} />
          ))}
        </TableBody>
      </Table>
      {/* (no global sr-only entry - per-row sr-only is provided inside the colors cell) */}
    </div>
  )
}
