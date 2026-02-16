import { notFound } from "next/navigation"
import AdminOrderItemsEditor from "@/components/admin/AdminOrderItemsEditor"
import { DeleteOrderButton } from "@/components/admin/DeleteOrderButton"
import { GenerateInvoiceButton } from "@/components/admin/GenerateInvoiceButton"
import { OrderAttachmentsList } from "@/components/admin/OrderAttachmentsList"
import OrderStatusForm from "@/components/admin/OrderStatusForm"
import { AddressDisplay } from "@/components/site/AddressDisplay"
import BackLink from "@/components/site/BackLink"
import ContactInfo from "@/components/site/ContactInfo"
import { OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import type { OrderStatus } from "@/generated/enums"
import { getCurrentUser } from "@/lib/current-user"
import { getTrackedDb } from "@/lib/db"
import { formatDate } from "@/lib/utils"

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const db = getTrackedDb(true)

  const { id } = await params

  // Fetch the order and products (products used by ProductMultiSelect)
  const [order, products, user] = await Promise.all([
    db.order.findUnique({
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
        // return attachments with newest first so invoices appear most-recent-on-top
        attachments: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.product.findMany({ orderBy: { name: "asc" } }),
    getCurrentUser(),
  ])

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
          <div className="space-y-6">
            <AdminOrderItemsEditor order={order} products={products} user={user} />

            {/* Invoices & Attachments */}
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-4">Invoices & Attachments</h2>
              <div className="mb-4">
                <GenerateInvoiceButton orderId={order.id} />
              </div>

              <OrderAttachmentsList attachments={order.attachments || []} />
            </div>
          </div>

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
            <ContactInfo name={order.user.name || undefined} email={order.user.email} />
          </div>

          {/* Contact Information */}
          {order.deliveryAddress && (
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-4">Delivery Contact</h2>
              <ContactInfo
                name={
                  `${order.deliveryAddress.firstName || ""} ${order.deliveryAddress.lastName || ""}`.trim() ||
                  undefined
                }
                email={order.deliveryAddress.email}
                phone={order.deliveryAddress.phone}
              />
            </div>
          )}

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-4 flex items-center gap-2">Delivery Address</h2>
              <AddressDisplay address={order.deliveryAddress} />
            </div>
          )}

          {/* Delete order (admin) */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4">Danger Zone</h2>
            <div className="flex items-center gap-2">
              <DeleteOrderButton
                orderId={order.id}
                hasAttachments={(order.attachments || []).length > 0}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
