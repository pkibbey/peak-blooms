import Link from "next/link"
import { type OrderStatus, OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import { Button } from "@/components/ui/button"
import { IconEye } from "@/components/ui/icons"
import { SortableTableHead } from "@/components/ui/SortableTableHead"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate, formatPrice } from "@/lib/utils"

interface OrderUser {
  id: string
  email: string | null
  name: string | null
}

interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  total: number
  email: string
  createdAt: Date
  user: OrderUser
  _count: {
    items: number
  }
}

interface OrdersTableProps {
  orders: Order[]
  currentStatus: string
  sort?: string | null
  order?: "asc" | "desc" | null
}

function buildHeaderUrl(status: string): string {
  const baseUrl = "/admin/orders"
  if (status === "ALL") {
    return baseUrl
  }
  return `${baseUrl}?status=${status}`
}

export default function OrdersTable({ orders, currentStatus, sort, order }: OrdersTableProps) {
  const statusFilters = [
    { value: "ALL", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "SHIPPED", label: "Shipped" },
    { value: "DELIVERED", label: "Delivered" },
    { value: "CANCELLED", label: "Cancelled" },
  ]

  const headerUrl = buildHeaderUrl(currentStatus)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filter by status:</span>
          <div className="flex flex-wrap gap-1">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={currentStatus === filter.value ? "default" : "outline"}
                size="sm"
                asChild
              >
                <Link
                  href={
                    filter.value === "ALL"
                      ? "/admin/orders"
                      : `/admin/orders?status=${filter.value}`
                  }
                >
                  {filter.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">
          No orders found{currentStatus !== "ALL" ? ` with status "${currentStatus}"` : ""}.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead
                  label="Order"
                  sortKey="orderNumber"
                  currentSort={sort}
                  currentOrder={order}
                  href={headerUrl}
                />
                <SortableTableHead
                  label="Customer"
                  sortKey="customer"
                  currentSort={sort}
                  currentOrder={order}
                  href={headerUrl}
                />
                <SortableTableHead
                  label="Date"
                  sortKey="date"
                  currentSort={sort}
                  currentOrder={order}
                  href={headerUrl}
                  className="hidden md:table-cell"
                />
                <SortableTableHead
                  label="Items"
                  sortKey="items"
                  currentSort={sort}
                  currentOrder={order}
                  href={headerUrl}
                  className="hidden lg:table-cell"
                />
                <TableHead>Items</TableHead>
                <SortableTableHead
                  label="Status"
                  sortKey="status"
                  currentSort={sort}
                  currentOrder={order}
                  href={headerUrl}
                />
                <SortableTableHead
                  label="Total"
                  sortKey="total"
                  currentSort={sort}
                  currentOrder={order}
                  href={headerUrl}
                  className="text-right"
                />
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.user.name || "—"}</p>
                        <p className="text-sm text-muted-foreground">{order.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {order._count.items}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(order.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <IconEye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
