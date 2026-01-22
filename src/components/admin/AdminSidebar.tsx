import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  IconBarChart3,
  IconClock,
  IconPackage,
  IconShoppingCart,
  IconStar,
  IconUser,
} from "@/components/ui/icons"
import { getTrackedDb } from "@/lib/db"
import QuickActions from "./QuickActions"

export default async function AdminSidebar() {
  const db = getTrackedDb(true)

  // lightweight counts for nav badges
  const pendingOrders = await db.order.count({ where: { status: "PENDING" } })
  const pendingApprovals = await db.user.count({ where: { approved: false } })
  const productCount = await db.product.count({ where: { deletedAt: null } })
  const collectionCount = await db.collection.count()
  const inspirationCount = await db.inspiration.count()

  return (
    <div className="space-y-4">
      <nav className="rounded-lg border border-border p-4 bg-primary-foreground">
        <h4 className="heading-4 mb-2">Navigation</h4>

        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href="/admin"
              className="flex items-center justify-between w-full hover:underline"
            >
              <span className="flex items-center gap-2">
                <IconStar className="h-4 w-4 text-muted-foreground" /> Dashboard
              </span>
            </Link>
          </li>

          <li>
            <Link
              href="/admin/orders"
              className="flex items-center justify-between w-full hover:underline"
            >
              <span className="flex items-center gap-2">
                <IconClock className="h-4 w-4 text-muted-foreground" /> Orders
              </span>
              {pendingOrders > 0 && <Badge variant="secondary">{pendingOrders}</Badge>}
            </Link>
          </li>

          <li>
            <Link
              href="/admin/products"
              className="flex items-center justify-between w-full hover:underline"
            >
              <span className="flex items-center gap-2">
                <IconPackage className="h-4 w-4 text-muted-foreground" /> Products
              </span>
              {productCount > 0 && <Badge variant="secondary">{productCount}</Badge>}
            </Link>
          </li>

          <li>
            <Link
              href="/admin/collections"
              className="flex items-center justify-between w-full hover:underline"
            >
              <span className="flex items-center gap-2">
                <IconShoppingCart className="h-4 w-4 text-muted-foreground" /> Collections
              </span>
              {collectionCount > 0 && <Badge variant="secondary">{collectionCount}</Badge>}
            </Link>
          </li>

          <li>
            <Link
              href="/admin/inspirations"
              className="flex items-center justify-between w-full hover:underline"
            >
              <span className="flex items-center gap-2">
                <IconStar className="h-4 w-4 text-muted-foreground" /> Inspirations
              </span>
              {inspirationCount > 0 && <Badge variant="secondary">{inspirationCount}</Badge>}
            </Link>
          </li>

          <li>
            <Link
              href="/admin/users"
              className="flex items-center justify-between w-full hover:underline"
            >
              <span className="flex items-center gap-2">
                <IconUser className="h-4 w-4 text-muted-foreground" /> Users
              </span>
              {pendingApprovals > 0 && <Badge variant="secondary">{pendingApprovals}</Badge>}
            </Link>
          </li>

          {process.env.NODE_ENV === "development" && (
            <li>
              <Link
                href="/admin/metrics"
                className="flex items-center justify-between w-full hover:underline"
              >
                <span className="flex items-center gap-2">
                  <IconBarChart3 className="h-4 w-4 text-muted-foreground" /> Database Metrics
                </span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      <QuickActions />
    </div>
  )
}
