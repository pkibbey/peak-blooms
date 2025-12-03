import Link from "next/link"
import { AdminPagination } from "@/components/admin/AdminPagination"
import ProductsTable from "@/components/admin/ProductsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"

// no direct db usage here — use DAL

interface AdminProductsPageProps {
  searchParams: Record<string, string | string[] | undefined>
}

const ITEMS_PER_PAGE = 20

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  // Parse page from search params (1-indexed)
  const page = typeof searchParams?.page === "string" ? parseInt(searchParams.page, 20) : 1
  const offset = Math.max(0, (page - 1) * ITEMS_PER_PAGE)

  // Use the DAL to fetch a page of products with counts
  const { getProducts } = await import("@/lib/data")
  const result = await getProducts(
    {
      limit: ITEMS_PER_PAGE,
      offset,
    },
    1.0
  )

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
      {result.products.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {result.offset + 1} to {Math.min(result.offset + ITEMS_PER_PAGE, result.total)}{" "}
            of {result.total} products
          </p>
          {Math.ceil(result.total / ITEMS_PER_PAGE) > 1 && (
            <AdminPagination
              currentPage={page}
              totalPages={Math.ceil(result.total / ITEMS_PER_PAGE)}
              searchParams={searchParams}
            />
          )}
        </div>
      )}

      <ProductsTable products={result.products} />

      {/* Bottom pagination */}
      {Math.ceil(result.total / ITEMS_PER_PAGE) > 1 && (
        <div className="mt-6 flex justify-end">
          <AdminPagination
            currentPage={page}
            totalPages={Math.ceil(result.total / ITEMS_PER_PAGE)}
            searchParams={searchParams}
          />
        </div>
      )}
    </>
  )
}
