import ActivityFeed from "@/components/admin/ActivityFeed"
import QuickActions from "@/components/admin/QuickActions"
import { db } from "@/lib/db"
import { formatPrice } from "@/lib/utils"

export default async function AdminDashboard() {
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
      subtitle: `${o.user?.name ?? o.user?.email ?? "Unknown"} — ${formatPrice(o.total)}`,
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
    </>
  )
}
