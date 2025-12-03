import Link from "next/link"
import { AdminPagination } from "@/components/admin/AdminPagination"
import ProductsTable from "@/components/admin/ProductsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"

// no direct db usage here — use DAL

interface AdminProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const ITEMS_PER_PAGE = 20

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams
  // Parse page from search params (1-indexed), reset to 1 on sort change
  const page = typeof params?.page === "string" ? parseInt(params.page, 20) : 1
  const offset = Math.max(0, (page - 1) * ITEMS_PER_PAGE)

  // Parse sort params
  const sort = typeof params?.sort === "string" ? params.sort : undefined
  const order = typeof params?.order === "string" ? (params.order as "asc" | "desc") : undefined

  // Use the DAL to fetch a page of products with counts
  const { getProducts } = await import("@/lib/data")
  const result = await getProducts(
    {
      limit: ITEMS_PER_PAGE,
      offset,
      // Pass sort to data layer only for database-sortable fields
      sort: sort && ["name", "createdAt", "featured"].includes(sort) ? sort : undefined,
      order,
    },
    1.0
  )

  // Apply client-side sorting for price and description
  const products = [...result.products]
  if (sort === "price") {
    products.sort((a, b) => {
      const aPrice = a.variants[0]?.price ?? 0
      const bPrice = b.variants[0]?.price ?? 0
      return order === "desc" ? bPrice - aPrice : aPrice - bPrice
    })
  } else if (sort === "description") {
    products.sort((a, b) => {
      const aDesc = a.description ?? ""
      const bDesc = b.description ?? ""
      const comparison = aDesc.localeCompare(bDesc)
      return order === "desc" ? -comparison : comparison
    })
  }

  // Build URL for table headers (preserves sort & order params)
  const baseUrl = "/admin/products"
  const headerUrl = `${baseUrl}?sort=${sort || ""}&order=${order || ""}`

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="heading-1">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your product catalog ({result.total} total)
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add New Product</Link>
        </Button>
      </div>

      {/* Summary + Pagination */}
      {products.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {result.offset + 1} to {Math.min(result.offset + ITEMS_PER_PAGE, result.total)}{" "}
            of {result.total} products
          </p>
          {Math.ceil(result.total / ITEMS_PER_PAGE) > 1 && (
            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(result.total / ITEMS_PER_PAGE)}
              searchParams={params}
            />
          )}
        </div>
      )}

      <ProductsTable products={products} sort={sort} order={order} headerUrl={headerUrl} />

      {/* Bottom pagination */}
      {Math.ceil(result.total / ITEMS_PER_PAGE) > 1 && (
        <div className="mt-6 flex justify-end">
          <AdminPagination
            currentPage={page}
            totalPages={Math.ceil(result.total / ITEMS_PER_PAGE)}
            searchParams={params}
          />
        </div>
      )}
    </>
  )
}
