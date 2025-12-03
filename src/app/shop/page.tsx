import { Suspense } from "react"
import { BoxlotFilter } from "@/components/site/BoxlotFilter"
import { PageHeader } from "@/components/site/PageHeader"
import { ProductCard } from "@/components/site/ProductCard"
import { ShopFilters } from "@/components/site/ShopFilters"
import { ShopPagination } from "@/components/site/ShopPagination"
import { ShopProductTableRow } from "@/components/site/ShopProductTableRow"
import { ViewToggle } from "@/components/site/ViewToggle"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCurrentUser } from "@/lib/current-user"
import { getProducts, getShopFilterOptions } from "@/lib/data"

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Peak Blooms - Shop",
  description: "Browse our full catalog of premium flowers",
}

const ITEMS_PER_PAGE = 12

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  // Fetch available filter options
  const filterOptions = await getShopFilterOptions()

  // Parse filter parameters
  const collectionId = typeof params.collectionId === "string" ? params.collectionId : undefined
  // Accept multiple colors passed as `colors` param (comma separated or repeated keys)
  const colors =
    typeof params.colors === "string"
      ? params.colors
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : Array.isArray(params.colors)
        ? params.colors
        : undefined
  const stemLengthMin =
    typeof params.stemLengthMin === "string" ? parseInt(params.stemLengthMin, 10) : undefined
  const stemLengthMax =
    typeof params.stemLengthMax === "string" ? parseInt(params.stemLengthMax, 10) : undefined
  const priceMin = typeof params.priceMin === "string" ? parseFloat(params.priceMin) : undefined
  const priceMax = typeof params.priceMax === "string" ? parseFloat(params.priceMax) : undefined
  const boxlotOnly = params.boxlotOnly === "true"
  const viewMode = typeof params.view === "string" ? params.view : "grid"
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const offset = Math.max(0, (page - 1) * ITEMS_PER_PAGE)

  // Fetch products using DAL with pagination
  const result = await getProducts(
    {
      collectionId: collectionId || undefined,
      colors: colors,
      stemLengthMin:
        stemLengthMin !== undefined && !Number.isNaN(stemLengthMin) ? stemLengthMin : undefined,
      stemLengthMax:
        stemLengthMax !== undefined && !Number.isNaN(stemLengthMax) ? stemLengthMax : undefined,
      priceMin: priceMin !== undefined && !Number.isNaN(priceMin) ? priceMin : undefined,
      priceMax: priceMax !== undefined && !Number.isNaN(priceMax) ? priceMax : undefined,
      boxlotOnly,
      limit: ITEMS_PER_PAGE,
      offset,
    },
    multiplier
  )

  const totalPages = Math.ceil(result.total / ITEMS_PER_PAGE)

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader title="Shop" description="Browse our full catalog of premium flowers" />

      <div className="flex gap-6 lg:gap-8">
        {/* Sidebar Filters */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-20">
            <Suspense fallback={null}>
              <ShopFilters
                availableColors={filterOptions.colors}
                availableCollections={filterOptions.collections}
              />
            </Suspense>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Mobile Filters + View Toggle */}
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center flex-1 lg:hidden">
                <Suspense fallback={null}>
                  <ShopFilters
                    availableColors={filterOptions.colors}
                    availableCollections={filterOptions.collections}
                  />
                </Suspense>
              </div>
            </div>

            {/* Boxlot Filter + Message */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <Suspense fallback={null}>
                <BoxlotFilter />
              </Suspense>
              <Suspense fallback={null}>
                <ViewToggle />
              </Suspense>
            </div>
          </div>

          {/* Products Info */}
          {result.products.length > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing {result.offset + 1} to{" "}
              {Math.min(result.offset + ITEMS_PER_PAGE, result.total)} of {result.total} products
            </p>
          )}

          {/* Products Grid or Table */}
          {result.products.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <p className="text-muted-foreground">No products found matching your filters.</p>
            </div>
          ) : viewMode === "table" ? (
            <>
              <div className="rounded-md border mb-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.products.map((product) => (
                      <ShopProductTableRow key={product.slug} product={product} user={user} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <ShopPagination currentPage={page} totalPages={totalPages} searchParams={params} />
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 mb-8">
                {result.products.map((product) => (
                  <ProductCard key={product.slug} product={product} user={user} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <ShopPagination currentPage={page} totalPages={totalPages} searchParams={params} />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
