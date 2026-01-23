import Link from "next/link"
import { AdminPagination } from "@/components/admin/AdminPagination"
import { BatchGenerateDescriptionsButton } from "@/components/admin/BatchGenerateDescriptionsButton"
import { BatchGenerateImagesButton } from "@/components/admin/BatchGenerateImagesButton"
import { ProductFilters } from "@/components/admin/ProductFilters"
import ProductsTable from "@/components/admin/ProductsTable"
import BackLink from "@/components/site/BackLink"
import { Button } from "@/components/ui/button"
import { ProductType } from "@/generated/enums"
import { ITEMS_PER_PAGE } from "@/lib/consts"

// no direct db usage here - use DAL

interface AdminProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const params = await searchParams
  // Parse page from search params (1-indexed), reset to 1 on sort change
  const page = typeof params?.page === "string" ? parseInt(params.page, 10) : 1
  const offset = Math.max(0, (page - 1) * ITEMS_PER_PAGE)

  // Parse sort params with default to name ascending
  const sort = typeof params?.sort === "string" ? params.sort : "name"
  const order = typeof params?.order === "string" ? (params.order as "asc" | "desc") : "asc"

  // Parse filter params
  const filterDescription = params?.filterDescription as "has" | "missing" | undefined
  const filterImages = params?.filterImages as "has" | "missing" | undefined
  const types = params?.types
    ? typeof params.types === "string"
      ? params.types.split(",").filter(Boolean)
      : Array.isArray(params.types)
        ? params.types
        : [params.types[0]]
    : undefined

  // Use the DAL to fetch a page of products with counts
  const { getProducts } = await import("@/lib/data")
  const result = await getProducts(
    {
      limit: ITEMS_PER_PAGE,
      offset,
      // Pass sort to data layer only for database-sortable fields
      sort:
        sort && ["name", "createdAt", "featured", "price", "productType"].includes(sort)
          ? sort
          : "name",
      order,
      // Pass filter options
      filterDescription,
      filterImages,
      types,
    },
    1.0
  )

  // Count products without descriptions (null or empty string) for batch generation button
  // This count reflects the current filters
  const { getProducts: getProductsForCount } = await import("@/lib/data")
  const countResult = await getProductsForCount(
    {
      // Apply filters to count (only missing descriptions)
      filterDescription: "missing",
      filterImages,
      types,
      // No pagination for count
      limit: 999999,
    },
    1.0
  )
  const productsMissingDescriptions = countResult.total

  // Count products without images (respect current filters)
  const countResultImages = await getProductsForCount(
    {
      // Apply filters to count (only missing images)
      filterImages: "missing",
      filterDescription,
      types,
      limit: 999999,
    },
    1.0
  )
  const productsMissingImages = countResultImages.total

  // Apply client-side sorting for description only (price is now server-side)
  const products = [...result.products]
  if (sort === "description") {
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

  // Check if any filters are active
  const hasActiveFilters = !!(filterDescription || filterImages || (types && types.length > 0))

  // Get all product types for filter options
  const allProductTypes = Object.values(ProductType).sort()

  return (
    <>
      <div className="flex gap-2 justify-between items-center">
        <BackLink href="/admin" label="Dashboard" />
        <div className="flex flex-col flex-wrap justify-end gap-2 sm:flex-row">
          {productsMissingDescriptions > 0 && (
            <BatchGenerateDescriptionsButton
              remainingCount={productsMissingDescriptions}
              filters={{
                filterDescription: "missing",
                filterImages,
                types,
              }}
            />
          )}

          {productsMissingImages > 0 && (
            <BatchGenerateImagesButton
              remainingCount={productsMissingImages}
              filters={{
                filterDescription,
                filterImages: "missing",
                types,
              }}
            />
          )}
          <Button
            nativeButton={false}
            render={<Link href="/admin/products/new">New Product</Link>}
          />
        </div>
      </div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-1">Products</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your product catalog ({result.total} total)
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-[236px_1fr] gap-6 items-start">
        {/* Filters Sidebar */}
        <ProductFilters productTypes={allProductTypes as ProductType[]} />

        {/* Products Section */}
        <div>
          {/* Summary + Pagination */}
          {products.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing {result.offset + 1} to{" "}
                {Math.min(result.offset + ITEMS_PER_PAGE, result.total)} of {result.total} products
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

          <ProductsTable
            products={products}
            sort={sort}
            order={order}
            headerUrl={headerUrl}
            hasActiveFilters={hasActiveFilters}
          />

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
        </div>
      </div>
    </>
  )
}
