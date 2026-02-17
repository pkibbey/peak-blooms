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
export default async function AdminSidebar() {
  const db = getTrackedDb(true)

  // lightweight counts for nav badges
  const pendingOrders = await db.order.count({ where: { status: "PENDING" } })
  const pendingApprovals = await db.user.count({ where: { approved: false } })
  const productCount = await db.product.count({ where: { deletedAt: null } })
  const collectionCount = await db.collection.count()
  const inspirationCount = await db.inspiration.count()

  return (
    <nav className="rounded-lg border border-border bg-primary-foreground px-4 py-3">
      <ul className="flex flex-wrap items-center gap-4 text-sm">
        <li>
          <Link href="/admin" className="flex items-center gap-2 hover:underline">
            <span className="flex items-center gap-2">
              <IconStar className="h-4 w-4 text-muted-foreground" /> Dashboard
            </span>
          </Link>
        </li>

        <li>
          <Link href="/admin/orders" className="flex items-center gap-2 hover:underline">
            <span className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" /> Orders
            </span>
            {pendingOrders > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingOrders}
              </Badge>
            )}
          </Link>
        </li>

        <li>
          <Link href="/admin/products" className="flex items-center gap-2 hover:underline">
            <span className="flex items-center gap-2">
              <IconPackage className="h-4 w-4 text-muted-foreground" /> Products
            </span>
            {productCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {productCount}
              </Badge>
            )}
          </Link>
        </li>

        <li>
          <Link href="/admin/collections" className="flex items-center gap-2 hover:underline">
            <span className="flex items-center gap-2">
              <IconShoppingCart className="h-4 w-4 text-muted-foreground" /> Collections
            </span>
            {collectionCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {collectionCount}
              </Badge>
            )}
          </Link>
        </li>

        <li>
          <Link href="/admin/inspirations" className="flex items-center gap-2 hover:underline">
            <span className="flex items-center gap-2">
              <IconStar className="h-4 w-4 text-muted-foreground" /> Inspirations
            </span>
            {inspirationCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {inspirationCount}
              </Badge>
            )}
          </Link>
        </li>

        <li>
          <Link href="/admin/users" className="flex items-center gap-2 hover:underline">
            <span className="flex items-center gap-2">
              <IconUser className="h-4 w-4 text-muted-foreground" /> Users
            </span>
            {pendingApprovals > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingApprovals}
              </Badge>
            )}
          </Link>
        </li>

        {process.env.NODE_ENV === "development" && (
          <li>
            <Link href="/admin/metrics" className="flex items-center gap-2 hover:underline">
              <span className="flex items-center gap-2">
                <IconBarChart3 className="h-4 w-4 text-muted-foreground" />
                Metrics
              </span>
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
