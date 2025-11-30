import Link from "next/link"
import ActivityFeed from "@/components/admin/ActivityFeed"
import QuickActions from "@/components/admin/QuickActions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconClock } from "@/components/ui/icons"
import { db } from "@/lib/db"

export default async function AdminDashboard() {
  // Counts for overview
  const pendingOrdersCount = await db.order.count({ where: { status: "PENDING" } })

  // Recent items for activity feed
  const recentOrders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { user: true },
  })

  const recentUsers = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 6 })

  // Build a merged feed, sort by createdAt, and take top 8
  const feed = [
    ...recentOrders.map((o) => ({
      id: o.id,
      type: "order",
      title: `Order ${o.orderNumber} placed`,
      subtitle: `${o.user?.name ?? o.user?.email ?? "Unknown"} — $${o.total.toFixed(2)}`,
      createdAt: o.createdAt.toISOString(),
      href: `/admin/orders/${o.id}`,
    })),
    ...recentUsers.map((u) => ({
      id: u.id,
      type: "user",
      title: u.approved ? `User ${u.email} created` : `User ${u.email} signed up (pending)`,
      subtitle: u.name ?? u.email ?? "",
      createdAt: u.createdAt.toISOString(),
      href: `/admin/users#${u.id}`,
    })),
  ]

  const sortedFeed = feed.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 8)

  // Build simple 7-day series for orders and user signups (oldest -> newest)
  const days = 7
  const today = new Date()
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  return (
    <>
      <div className="mb-8">
        <h1 className="heading-1">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Manage Peak Blooms content and user approvals</p>
      </div>

      {/* Row with quick actions and activity feed */}
      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed items={sortedFeed} />
        </div>
      </div>

      {/* Orders section */}
      <div className="mb-6 rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="heading-2">Orders</h2>
              {pendingOrdersCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  {pendingOrdersCount} pending
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">View and manage customer orders</p>
          </div>
          <div className="shrink-0 flex gap-2">
            {pendingOrdersCount > 0 && (
              <Button asChild variant="outline" className="mt-2">
                <Link href="/admin/orders?status=PENDING">View Pending</Link>
              </Button>
            )}
            <Button asChild className="mt-2">
              <Link href="/admin/orders">All Orders</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Users section */}
      <div className="mb-6 rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="heading-2">User Accounts</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review and approve pending user accounts
            </p>
          </div>
          <div className="shrink-0">
            <Button asChild className="mt-2">
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Content management section */}
      <div className="rounded-lg border border-border p-6 bg-card shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="heading-2">Content Management</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage products, collections, and inspirations
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <div className="rounded-md border border-border p-4">
            <h3 className="heading-3">Products</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add, edit, and manage product listings
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild size="sm">
                <Link href="/admin/products">Manage Products</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="heading-3">Collections</h3>
            <p className="mt-1 text-sm text-muted-foreground">Organize products into collections</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild size="sm">
                <Link href="/admin/collections">Manage Collections</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="heading-3">Inspirations</h3>
            <p className="mt-1 text-sm text-muted-foreground">Curate inspiration sets</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild size="sm">
                <Link href="/admin/inspirations">Manage Inspirations</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-border p-4">
            <h3 className="heading-3">Heroes</h3>
            <p className="mt-1 text-sm text-muted-foreground">Manage homepage hero banners</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button asChild size="sm">
                <Link href="/admin/heroes">Manage Heroes</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
