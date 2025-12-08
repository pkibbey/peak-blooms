import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  IconBarChart3,
  IconClock,
  IconMapPin,
  IconPackage,
  IconShoppingCart,
  IconStar,
  IconUser,
} from "@/components/ui/icons"
import { getTrackedDb } from "@/lib/db"

export default async function AdminSidebar() {
  const db = getTrackedDb(true)

  // lightweight counts for nav badges
  const pendingOrders = await db.order.count({ where: { status: "PENDING" } })
  const pendingApprovals = await db.user.count({ where: { approved: false } })

  return (
    <nav className="rounded-lg border border-border p-4 sticky top-20 bg-primary-foreground">
      <div className="mb-4">
        <h4 className="mb-1 text-sm font-semibold">Admin</h4>
        <p className="text-xs text-muted-foreground">Quick navigation</p>
      </div>

      <ul className="space-y-2 text-sm">
        <li>
          <Link href="/admin" className="flex items-center justify-between w-full hover:underline">
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground">Overview</span>
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
          </Link>
        </li>

        <li>
          <Link
            href="/admin/heroes"
            className="flex items-center justify-between w-full hover:underline"
          >
            <span className="flex items-center gap-2">
              <IconMapPin className="h-4 w-4 text-muted-foreground" /> Heroes
            </span>
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
      </ul>
    </nav>
  )
}
