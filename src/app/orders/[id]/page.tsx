import { redirect, notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconCheckCircle,
  IconClock,
  IconTruck,
  IconPackage,
  IconXCircle,
  IconMapPin,
} from "@/components/ui/icons"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

const statusConfig = {
  PENDING: { label: "Pending", variant: "secondary" as const, icon: IconClock },
  CONFIRMED: { label: "Confirmed", variant: "default" as const, icon: IconCheckCircle },
  SHIPPED: { label: "Shipped", variant: "default" as const, icon: IconTruck },
  DELIVERED: { label: "Delivered", variant: "default" as const, icon: IconPackage },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: IconXCircle },
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect(`/auth/signin?callbackUrl=/orders/${id}`)
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/auth/pending-approval")
  }

  // Fetch the order
  const order = await db.order.findFirst({
    where: {
      id,
      userId: user.id, // Ensure user owns this order
    },
    include: {
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold font-serif">Order {order.orderNumber}</h1>
            <Badge variant={status.variant} className="text-sm">
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/orders">View All Orders</Link>
        </Button>
      </div>

      {/* Success Message for new orders */}
      {order.status === "PENDING" && (
        <div className="bg-green-50 border border-green-200 rounded-xs p-4 mb-8">
          <div className="flex items-start gap-3">
            <IconCheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-800">Order Placed Successfully!</h3>
              <p className="text-sm text-green-700 mt-1">
                Thank you for your order. We&apos;ll send you an update when your order is
                confirmed.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const lineTotal = item.price * item.quantity
                const variantSpecs = item.productVariant
                  ? [
                      item.productVariant.stemLength ? `${item.productVariant.stemLength}cm` : null,
                      item.productVariant.countPerBunch
                        ? `${item.productVariant.countPerBunch} stems`
                        : null,
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
                          <p className="font-medium">{item.product.name}</p>
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
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Shipping</span>
                <span className="text-muted-foreground">Calculated separately</span>
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
              <p className="text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
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
              {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
              <p>{order.shippingAddress.street1}</p>
              {order.shippingAddress.street2 && <p>{order.shippingAddress.street2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
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
                {order.billingAddress.company && <p>{order.billingAddress.company}</p>}
                <p>{order.billingAddress.street1}</p>
                {order.billingAddress.street2 && <p>{order.billingAddress.street2}</p>}
                <p>
                  {order.billingAddress.city}, {order.billingAddress.state}{" "}
                  {order.billingAddress.zip}
                </p>
                <p>{order.billingAddress.country}</p>
              </address>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Contact Information</h2>
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
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href="/shop">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
