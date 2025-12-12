import { notFound } from "next/navigation"
import OrderStatusForm from "@/components/admin/OrderStatusForm"
import { AddressDisplay } from "@/components/site/AddressDisplay"
import BackLink from "@/components/site/BackLink"
import { OrderItemsCard } from "@/components/site/OrderItemsCard"
import { type OrderStatus, OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import { getTrackedDb } from "@/lib/db"
import { formatDate } from "@/lib/utils"

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  // Fetch the order
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      items: {
        include: {
          product: true,
        },
      },
      deliveryAddress: true,
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <>
      <BackLink href="/admin/orders" label="Orders" />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="heading-1">Order {order.orderNumber}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} className="text-sm" />
          </div>
          <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <OrderItemsCard items={order.items} total={order.total} />

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-2">Order Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status Update */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4">Update Status</h2>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Customer Info */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4">Customer</h2>
            <div className="text-sm space-y-2">
              <p className="font-medium">{order.user.name || "—"}</p>
              <p className="text-muted-foreground">{order.user.email}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4">Contact</h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{order.email}</span>
              </p>
              {order.phone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <span className="font-medium">{order.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4 flex items-center gap-2">Delivery Address</h2>
            <AddressDisplay address={order.deliveryAddress} />
          </div>
        </div>
      </div>
    </>
  )
}
