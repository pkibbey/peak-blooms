import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AddressDisplay } from "@/components/site/AddressDisplay"
import BackLink from "@/components/site/BackLink"
import { CancelOrderButton } from "@/components/site/CancelOrderButton"
import ContactInfo from "@/components/site/ContactInfo"
import { OrderItemsCard } from "@/components/site/OrderItemsCard"
import { OrderStatusBadge } from "@/components/site/OrderStatusBadge"
import { OrderTimeline } from "@/components/site/OrderTimeline"
import { Button } from "@/components/ui/button"
import { IconCheckCircle } from "@/components/ui/icons"
import type { OrderStatus } from "@/generated/enums"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

interface OrderDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params
  const user = await getCurrentUser()

  // Redirect to pending approval if not approved
  if (!user?.approved) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="heading-1">Order {order.orderNumber}</h1>
            <OrderStatusBadge status={order.status as OrderStatus} className="text-sm" />
          </div>
        </div>
      </div>

      {/* Order Timeline - Show for all non-cancelled orders */}
      {order.status !== "CANCELLED" && (
        <>
          <OrderTimeline status={order.status as OrderStatus} createdAt={order.createdAt} />

          {/* Process Message */}
          {(order.status === "CART" || order.status === "PENDING") && (
            <div className="bg-blue-50 border border-blue-200 rounded-xs p-4 mb-8">
              <div className="flex items-start gap-3">
                <IconCheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800">Next Steps</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Your order is being reviewed. We&apos;ll contact you to confirm market prices
                    and delivery details.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Order Items */}
        <div className="lg:col-span-2 space-y-4">
          <OrderItemsCard items={order.items} />

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
          {order.deliveryAddress && (
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-4 flex items-center gap-2">Delivery Address</h2>
              <AddressDisplay address={order.deliveryAddress} />
            </div>
          )}

          {/* Contact Information */}
          {order.deliveryAddress && (
            <div className="bg-background rounded-xs shadow-sm border p-6">
              <h2 className="heading-3 mb-4">Contact Information</h2>
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
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 space-y-4">
        <div className="flex gap-4">
          <Button nativeButton={false} render={<Link href="/shop">Continue Shopping</Link>} />
        </div>

        {/* Cancel Order Section - Only show for PENDING orders */}
        {order.status === "PENDING" && (
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-3">
              Need to make changes? You can cancel this order and start fresh.
            </p>
            <CancelOrderButton order={order} />
          </div>
        )}
      </div>
    </>
  )
}
