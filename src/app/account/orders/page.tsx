import Image from "next/image"
import Link from "next/link"
import BackLink from "@/components/site/BackLink"
import ReorderButton from "@/components/site/ReorderButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconCheckCircle,
  IconClock,
  IconPackage,
  IconTruck,
  IconXCircle,
} from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

const statusConfig = {
  PENDING: { label: "Pending", variant: "secondary" as const, icon: IconClock },
  CONFIRMED: { label: "Confirmed", variant: "default" as const, icon: IconCheckCircle },
  SHIPPED: { label: "Shipped", variant: "default" as const, icon: IconTruck },
  DELIVERED: { label: "Delivered", variant: "default" as const, icon: IconPackage },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: IconXCircle },
}

export default async function OrdersPage() {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to layout auth check
  if (!user) return null

  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
          productVariant: true,
        },
      },
    },
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
    }).format(new Date(date))
  }

  return (
    <>
      <BackLink href="/account" label="Account" />
      <div className="bg-white rounded-xs shadow-sm border p-6">
        <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
          <IconPackage className="h-5 w-5" />
          Orders
        </h2>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = statusConfig[order.status]
            const StatusIcon = status.icon

            return (
              <div key={order.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <Link href={`/orders/${order.id}`} className="font-medium hover:underline">
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <Badge variant={status.variant} className="text-xs">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>

                {/* Order Items Preview */}
                <div className="flex gap-1 mb-2">
                  {order.items.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xs bg-neutral-100"
                    >
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted" />
                      )}
                    </div>
                  ))}
                  {order.items.length > 5 && (
                    <div className="h-12 w-12 shrink-0 rounded-xs bg-neutral-100 flex items-center justify-center text-xs text-muted-foreground">
                      +{order.items.length - 5}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{formatPrice(order.total)}</p>
                  <ReorderButton
                    orderNumber={order.orderNumber}
                    items={order.items.map((item) => ({
                      productId: item.productId,
                      productVariantId: item.productVariantId,
                    }))}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <IconPackage className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No orders yet</p>
          <Button asChild>
            <Link href="/shop">Browse Products</Link>
          </Button>
        </div>
      )}
    </div>
    </>
  )
}
