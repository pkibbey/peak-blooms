import OrdersTable from "@/components/admin/OrdersTable"
import BackLink from "@/components/site/BackLink"
import { OrderStatus } from "@/generated/enums"
import { calculateCartTotal } from "@/lib/cart-utils"
import { getTrackedDb } from "@/lib/db"

interface AdminOrdersPageProps {
  searchParams: Promise<{ status?: string; sort?: string; order?: string }>
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  const db = getTrackedDb(true)

  const { status, sort, order } = await searchParams
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
      deliveryAddress: {
        select: {
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              price: true,
            },
          },
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

  // Client-side sort based on params
  const sortOrder = order as "asc" | "desc" | undefined
  if (sort === "orderNumber") {
    orders.sort((a, b) => {
      const comparison = a.orderNumber - b.orderNumber
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "date") {
    orders.sort((a, b) => {
      const comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      return sortOrder === "desc" ? -comparison : comparison
    })
  } else if (sort === "total") {
    orders.sort((a, b) => {
      const totalA = calculateCartTotal(a.items)
      const totalB = calculateCartTotal(b.items)
      return sortOrder === "desc" ? totalB - totalA : totalA - totalB
    })
  } else if (sort === "items") {
    orders.sort((a, b) => {
      const comparison = a._count.items - b._count.items
      return sortOrder === "desc" ? -comparison : comparison
    })
  }

  return (
    <>
      <BackLink href="/admin" label="Dashboard" />
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-1">Orders</h1>
          <p className="mt-2 text-muted-foreground">View and manage customer orders</p>
        </div>
      </div>

      <OrdersTable
        orders={orders}
        currentStatus={statusFilter || "ALL"}
        sort={sort}
        order={order as "asc" | "desc" | undefined}
      />
    </>
  )
}
