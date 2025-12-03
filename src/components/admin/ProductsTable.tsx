import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import ProductsTableRow from "./ProductsTableRow"

interface Product {
  id: string
  name: string
  slug: string
  featured: boolean
  image: string | null
  collection: {
    id: string
    name: string
  }
  variants: {
    id: string
    price: number
  }[]
  description?: string | null
  colors?: string[] | null
}

interface ProductsTableProps {
  products: Product[]
}

export default function ProductsTable({ products }: ProductsTableProps) {
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
            <TableHead>Name</TableHead>
            <TableHead className="hidden lg:table-cell">Price</TableHead>
            <TableHead className="hidden md:table-cell">Colors</TableHead>
            <TableHead className="hidden lg:table-cell">Description</TableHead>
            <TableHead>Featured</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <ProductsTableRow key={product.id} product={product} />
          ))}
        </TableBody>
      </Table>
      {/* (no global sr-only entry — per-row sr-only is provided inside the colors cell) */}
    </div>
  )
}
