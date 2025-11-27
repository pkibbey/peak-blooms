import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import OrdersTable from "@/components/admin/OrdersTable"
import { OrderStatus } from "@/generated/enums"
import BackLink from "@/components/site/BackLink"

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string }>
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const session = await auth()

  // Verify admin role
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

  const { status } = await searchParams
  const statusFilter = status as OrderStatus | undefined

  // Build where clause based on status filter
  const whereClause =
    statusFilter && Object.values(OrderStatus).includes(statusFilter)
      ? { status: statusFilter }
      : {}

  // Fetch orders
  const orders = await db.order.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin" label="Dashboard" />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="mt-2 text-muted-foreground">View and manage customer orders</p>
          </div>
        </div>

        <OrdersTable orders={orders} currentStatus={statusFilter || "ALL"} />
      </div>
    </div>
  )
}
