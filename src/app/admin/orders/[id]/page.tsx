import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import OrderStatusForm from "@/components/admin/OrderStatusForm"
import { IconCheckCircle, IconClock, IconTruck, IconPackage, IconXCircle, IconMapPin } from "@/components/ui/icons"
import BackLink from "@/components/site/BackLink"

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>
}

const statusConfig = {
  PENDING: { label: "Pending", variant: "secondary" as const, icon: IconClock },
  CONFIRMED: { label: "Confirmed", variant: "default" as const, icon: IconCheckCircle },
  SHIPPED: { label: "Shipped", variant: "default" as const, icon: IconTruck },
  DELIVERED: { label: "Delivered", variant: "default" as const, icon: IconPackage },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: IconXCircle },
}

export default async function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const session = await auth()

  // Verify admin role
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/unauthorized")
  }

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(date))
  }

  const status = statusConfig[order.status]
  const StatusIcon = status.icon

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <BackLink href="/admin/orders" label="Orders" />
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
              <Badge variant={status.variant} className="text-sm">
                <StatusIcon className="h-3 w-3 mr-1" />
                {status.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
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
                    ? [
                        item.productVariant.stemLength ? `${item.productVariant.stemLength}cm` : null,
                        item.productVariant.countPerBunch ? `${item.productVariant.countPerBunch} stems` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")
                    : null

                  return (
                    <div key={item.id} className="flex gap-4 py-4 border-b last:border-b-0">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xs bg-neutral-100">
                        {item.product.image ? (
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted" />
                        )}
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
              <address className="not-italic text-sm text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                {order.shippingAddress.company && (
                  <p>{order.shippingAddress.company}</p>
                )}
                <p>{order.shippingAddress.street1}</p>
                {order.shippingAddress.street2 && (
                  <p>{order.shippingAddress.street2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                </p>
                <p>{order.shippingAddress.country}</p>
              </address>
            </div>

            {/* Billing Address (if different) */}
            {order.billingAddress && (
              <div className="bg-white rounded-xs shadow-sm border p-6">
                <h2 className="text-lg font-semibold font-serif mb-4">Billing Address</h2>
                <address className="not-italic text-sm text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">
                    {order.billingAddress.firstName} {order.billingAddress.lastName}
                  </p>
                  {order.billingAddress.company && (
                    <p>{order.billingAddress.company}</p>
                  )}
                  <p>{order.billingAddress.street1}</p>
                  {order.billingAddress.street2 && (
                    <p>{order.billingAddress.street2}</p>
                  )}
                  <p>
                    {order.billingAddress.city}, {order.billingAddress.state} {order.billingAddress.zip}
                  </p>
                  <p>{order.billingAddress.country}</p>
                </address>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
