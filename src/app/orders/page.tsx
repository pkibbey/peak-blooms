import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { IconPackage, IconClock, IconCheckCircle, IconTruck, IconXCircle, IconEye, IconShoppingBag } from "@/components/ui/icons"

const statusConfig = {
  PENDING: { label: "Pending", variant: "secondary" as const, icon: IconClock },
  CONFIRMED: { label: "Confirmed", variant: "default" as const, icon: IconCheckCircle },
  SHIPPED: { label: "Shipped", variant: "default" as const, icon: IconTruck },
  DELIVERED: { label: "Delivered", variant: "default" as const, icon: IconPackage },
  CANCELLED: { label: "Cancelled", variant: "destructive" as const, icon: IconXCircle },
}

export default async function OrdersPage() {
  const user = await getCurrentUser()

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect("/auth/signin?callbackUrl=/orders")
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/auth/pending-approval")
  }

  // Fetch user's orders
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
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

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold font-serif mb-8">My Orders</h1>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <IconShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven&apos;t placed any orders yet. Start shopping to see your orders here.
          </p>
          <Button asChild>
            <Link href="/shop">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-serif mb-8">My Orders</h1>
      
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status]
          const StatusIcon = status.icon
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

          return (
            <div
              key={order.id}
              className="bg-white rounded-xs shadow-sm border p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-lg">{order.orderNumber}</h2>
                    <Badge variant={status.variant}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)} • {itemCount} {itemCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-lg">{formatPrice(order.total)}</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/orders/${order.id}`}>
                      <IconEye className="h-4 w-4 mr-1" />
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Preview of items */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {order.items.slice(0, 3).map((item) => item.product.name).join(", ")}
                  {order.items.length > 3 && ` and ${order.items.length - 3} more`}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
