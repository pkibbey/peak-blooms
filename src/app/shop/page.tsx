import { Suspense } from "react"
import { BoxlotFilter } from "@/components/site/BoxlotFilter"
import { PageHeader } from "@/components/site/PageHeader"
import { ProductCard } from "@/components/site/ProductCard"
import { ShippingBanner } from "@/components/site/ShippingBanner"
import { ShopFilters } from "@/components/site/ShopFilters"
import { ShopPagination } from "@/components/site/ShopPagination"
import { ShopProductTableRow } from "@/components/site/ShopProductTableRow"
import { ViewToggle } from "@/components/site/ViewToggle"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ITEMS_PER_PAGE } from "@/lib/consts"
import { getCurrentUser } from "@/lib/current-user"
import { getProducts, getShopFilterOptions } from "@/lib/data"

interface ShopPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const metadata = {
  title: "Peak Blooms - Shop",
  description: "Browse our full catalog of premium flowers",
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const user = await getCurrentUser()
  const multiplier = user?.priceMultiplier ?? 1.0

  // Fetch available filter options
  const filterOptions = await getShopFilterOptions()

  // Parse filter parameters
  const collectionIds =
    typeof params.collectionIds === "string"
      ? params.collectionIds
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      : Array.isArray(params.collectionIds)
        ? params.collectionIds
        : undefined
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
  const search = typeof params.search === "string" ? params.search : undefined
  const boxlotOnly = params.boxlotOnly === "true"
  const viewMode = typeof params.view === "string" ? params.view : "grid"
  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1
  const offset = Math.max(0, (page - 1) * ITEMS_PER_PAGE)

  // Parse sort params
  const sort = typeof params.sort === "string" ? params.sort : undefined
  const order = typeof params.order === "string" ? (params.order as "asc" | "desc") : undefined

  // Fetch products using DAL with pagination
  const result = await getProducts(
    {
      collectionIds: collectionIds || undefined,
      colors: colors,
      stemLengthMin:
        stemLengthMin !== undefined && !Number.isNaN(stemLengthMin) ? stemLengthMin : undefined,
      stemLengthMax:
        stemLengthMax !== undefined && !Number.isNaN(stemLengthMax) ? stemLengthMax : undefined,
      priceMin: priceMin !== undefined && !Number.isNaN(priceMin) ? priceMin : undefined,
      priceMax: priceMax !== undefined && !Number.isNaN(priceMax) ? priceMax : undefined,
      search: search || undefined,
      boxlotOnly,
      limit: ITEMS_PER_PAGE,
      offset,
      // Pass sort to data layer only for database-sortable fields
      sort: sort && ["name", "createdAt", "featured"].includes(sort) ? sort : undefined,
      order,
    },
    multiplier
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

  const totalPages = Math.ceil(result.total / ITEMS_PER_PAGE)

  // Build header URL preserving all filter params and sort
  const headerUrl = new URLSearchParams(params as Record<string, string>).toString()

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10">
        <PageHeader
          title="Premium Wholesale Flowers"
          description="Browse our carefully curated selection of the highest quality, freshest flowers. Every arrangement meets our standards for excellence, backed by reliable local delivery and competitive wholesale pricing."
        />

        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <Suspense fallback={null}>
                <ShopFilters
                  availableColorIds={filterOptions.colorIds}
                  availableCollections={filterOptions.collections}
                />
              </Suspense>
            </div>
          </aside>

          <div className="flex-1">
            {/* Mobile Filters + View Toggle */}
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4 items-center flex-1 lg:hidden">
                  <Suspense fallback={null}>
                    <ShopFilters
                      availableColorIds={filterOptions.colorIds}
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
            <div className="flex gap-4 justify-between items-center mb-4">
              {result.products.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Showing {result.offset + 1} to{" "}
                  {Math.min(result.offset + ITEMS_PER_PAGE, result.total)} of {result.total}{" "}
                  products
                </p>
              )}
              {/* Pagination */}
              {totalPages > 1 && (
                <ShopPagination currentPage={page} totalPages={totalPages} searchParams={params} />
              )}
            </div>

            {/* Products Grid or Table */}
            {products.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <p className="text-muted-foreground">No products found matching your filters.</p>
              </div>
            ) : viewMode === "table" ? (
              <>
                <div className="rounded-md border mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <SortableTableHead
                          label="Name"
                          sortKey="name"
                          currentSort={sort}
                          currentOrder={order}
                          href={`/shop?${headerUrl}`}
                        />
                        <SortableTableHead
                          label="Description"
                          sortKey="description"
                          currentSort={sort}
                          currentOrder={order}
                          href={`/shop?${headerUrl}`}
                          className="hidden md:table-cell"
                        />
                        <TableHead>Colors</TableHead>
                        <SortableTableHead
                          label="Price"
                          sortKey="price"
                          currentSort={sort}
                          currentOrder={order}
                          href={`/shop?${headerUrl}`}
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <ShopProductTableRow key={product.slug} product={product} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-end">
                    <ShopPagination
                      currentPage={page}
                      totalPages={totalPages}
                      searchParams={params}
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 mb-8">
                  {products.map((product) => (
                    <ProductCard key={product.slug} product={product} user={user} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-end">
                    <ShopPagination
                      currentPage={page}
                      totalPages={totalPages}
                      searchParams={params}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <ShippingBanner />
      </div>
    </>
  )
}
