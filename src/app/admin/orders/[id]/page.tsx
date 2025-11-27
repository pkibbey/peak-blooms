import Link from "next/link"
import { notFound } from "next/navigation"
import OrderStatusForm from "@/components/admin/OrderStatusForm"
import { AddressDisplay } from "@/components/site/AddressDisplay"
import BackLink from "@/components/site/BackLink"
import { OrderStatusBadge, type OrderStatus } from "@/components/site/OrderStatusBadge"
import { IconMapPin } from "@/components/ui/icons"
import { db } from "@/lib/db"
import { formatDate, formatPrice, formatVariantSpecs } from "@/lib/utils"

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
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
          productVariant: true,
        },
      },
      shippingAddress: true,
      billingAddress: true,
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
            <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} className="text-sm" />
          </div>
          <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const lineTotal = item.price * item.quantity
                const variantSpecs = item.productVariant
                  ? formatVariantSpecs(
                      item.productVariant.stemLength,
                      item.productVariant.countPerBunch
                    )
                  : null

                return (
                  <div key={item.id} className="flex gap-4 py-4 border-b last:border-b-0">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xs bg-neutral-100">
                      <div className="h-full w-full bg-muted" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <Link
                            href={`/admin/products/${item.productId}/edit`}
                            className="font-medium hover:text-primary hover:underline"
                          >
                            {item.product.name}
                          </Link>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatPrice(item.price)} × {item.quantity}
                            {variantSpecs && ` • ${variantSpecs}`}
                          </p>
                        </div>
                        <p className="font-medium">{formatPrice(lineTotal)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order Total */}
            <div className="border-t mt-4 pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-white rounded-xs shadow-sm border p-6">
              <h2 className="text-lg font-semibold font-serif mb-2">Order Notes</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Status Update */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Update Status</h2>
            <OrderStatusForm orderId={order.id} currentStatus={order.status} />
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Customer</h2>
            <div className="text-sm space-y-2">
              <p className="font-medium">{order.user.name || "—"}</p>
              <p className="text-muted-foreground">{order.user.email}</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Contact</h2>
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

          {/* Shipping Address */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
              <IconMapPin className="h-5 w-5" />
              Shipping Address
            </h2>
            <AddressDisplay address={order.shippingAddress} />
          </div>

          {/* Billing Address (if different) */}
          {order.billingAddress && (
            <div className="bg-white rounded-xs shadow-sm border p-6">
              <h2 className="text-lg font-semibold font-serif mb-4">Billing Address</h2>
              <AddressDisplay address={order.billingAddress} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}
