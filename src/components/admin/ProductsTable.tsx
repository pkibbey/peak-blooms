import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { ProductWithCollections } from "@/lib/query-types"
import ProductsTableRow from "./ProductsTableRow"

interface ProductsTableProps {
  products: ProductWithCollections[]
  sort?: string | null
  order?: "asc" | "desc" | null
  headerUrl: string
  hasActiveFilters?: boolean
}

export default function ProductsTable({
  products,
  sort,
  order,
  headerUrl,
  hasActiveFilters,
}: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground">
        {hasActiveFilters
          ? "No products match your filters. Try adjusting or clearing your filters."
          : "No products found. Add your first product to get started."}
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
            <SortableTableHead
              label="Type"
              sortKey="productType"
              currentSort={sort}
              currentOrder={order}
              href={headerUrl}
              className="hidden md:table-cell"
            />
            <TableHead>Featured</TableHead>
            <TableHead className="hidden lg:table-cell">Description</TableHead>
            <TableHead className="hidden lg:table-cell">Colors</TableHead>
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
