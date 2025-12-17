import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AddressDisplay } from "@/components/site/AddressDisplay"
import BackLink from "@/components/site/BackLink"
import { CancelOrderButton } from "@/components/site/CancelOrderButton"
import { OrderItemsCard } from "@/components/site/OrderItemsCard"
import { type OrderStatus, OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import { Button } from "@/components/ui/button"
import { IconCheckCircle } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/current-user"
import { calculateCartTotal } from "@/lib/cart-utils"
import { db } from "@/lib/db"
import { formatDate } from "@/lib/utils"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect(`/auth/signin?callbackUrl=/account/order-history/${id}`)
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/pending-approval")
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
      <BackLink href="/account/order-history" label="Order History" />
      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="heading-1">Order {order.orderNumber}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} className="text-sm" />
          </div>
          <p className="text-muted-foreground">Placed on {formatDate(order.createdAt)}</p>
        </div>
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
          <OrderItemsCard items={order.items} total={calculateCartTotal(order.items)} />

          {/* Order Notes */}
          {order.notes && (
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-2">Order Notes</h2>
              <p className="text-muted-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Delivery Address */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4 flex items-center gap-2">Delivery Address</h2>
            <AddressDisplay address={order.deliveryAddress} />
          </div>

          {/* Contact Information */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4">Contact Information</h2>
            <div className="text-sm space-y-2">
              <p>
                <span className="text-muted-foreground">Email:</span>{" "}
                <span className="font-medium">{order.deliveryAddress.email}</span>
              </p>
              {order.deliveryAddress.phone && (
                <p>
                  <span className="text-muted-foreground">Phone:</span>{" "}
                  <span className="font-medium">{order.deliveryAddress.phone}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-4">
        <div className="flex gap-4">
          <Button
            nativeButton={false}
            render={
              <Link prefetch={false} href="/shop">
                Continue Shopping
              </Link>
            }
          />
        </div>

        {/* Cancel Order Section - Only show for PENDING orders */}
        {order.status === "PENDING" && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Need to make changes? You can cancel this order and start fresh.
            </p>
            <CancelOrderButton orderId={order.id} orderNumber={order.orderNumber} />
          </div>
        )}
      </div>
    </>
  )
}
