import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import ChartSparkline from "@/components/ui/ChartSparkline"
import { IconClock, IconPackage, IconShoppingBag, IconUser } from "@/components/ui/icons"

interface OverviewCounts {
  pendingOrders: number
  pendingApprovals: number
  products: number
  collections: number
  ordersSpark?: number[]
  usersSpark?: number[]
}

export default function OverviewCards({
  pendingOrders,
  pendingApprovals,
  products,
  collections,
  ordersSpark,
  usersSpark,
}: OverviewCounts) {
  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Pending orders */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              <IconClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending orders</p>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold">{pendingOrders}</div>
                {pendingOrders > 0 && <Badge variant="secondary">{pendingOrders} waiting</Badge>}
              </div>
              {ordersSpark && ordersSpark.length > 0 && (
                <div className="mt-2">
                  <ChartSparkline data={ordersSpark} width={120} height={28} color="#06b6d4" />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/orders?status=PENDING">View</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Pending approvals */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              <IconUser className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending approvals</p>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold">{pendingApprovals}</div>
                {pendingApprovals > 0 && <Badge variant="secondary">{pendingApprovals} new</Badge>}
              </div>
              {usersSpark && usersSpark.length > 0 && (
                <div className="mt-2">
                  <ChartSparkline data={usersSpark} width={120} height={28} color="#a78bfa" />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/users">View</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              <IconPackage className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Products</p>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold">{products}</div>
                <p className="text-sm text-muted-foreground">total</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/products">Manage</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Collections */}
      <div className="rounded-lg border border-border p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-muted p-2 text-muted-foreground">
              <IconShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Collections</p>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-semibold">{collections}</div>
                <p className="text-sm text-muted-foreground">groups</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href="/admin/collections">Manage</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
