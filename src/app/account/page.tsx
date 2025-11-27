import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import AddressManager from "@/components/site/AddressManager"
import ReorderButton from "@/components/site/ReorderButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  IconArrowRight,
  IconCheckCircle,
  IconClock,
  IconMapPin,
  IconPackage,
  IconTruck,
  IconUser,
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

export default async function AccountPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin?callbackUrl=/account")
  }

  // Fetch user's addresses
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })

  // Fetch recent orders
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      items: {
        include: {
          product: true,
          productVariant: true,
        },
      },
    },
  })

  // Count total orders
  const totalOrders = await db.order.count({
    where: { userId: user.id },
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
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-serif mb-8">My Account</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Profile Card */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Profile
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{user.name || "Not set"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <div className="flex items-center gap-2">
                  {user.approved ? (
                    <Badge variant="default">
                      <IconCheckCircle className="h-3 w-3 mr-1" />
                      Approved
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <IconClock className="h-3 w-3 mr-1" />
                      Pending Approval
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
              <IconMapPin className="h-5 w-5" />
              Delivery Addresses
            </h2>
            <AddressManager addresses={addresses} />
          </div>
        </div>

        {/* Sidebar - Recent Orders */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold font-serif flex items-center gap-2">
                <IconPackage className="h-5 w-5" />
                Recent Orders
              </h2>
              {totalOrders > 5 && (
                <Link
                  href="/orders"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View all
                  <IconArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => {
                  const status = statusConfig[order.status]
                  const StatusIcon = status.icon

                  return (
                    <div key={order.id} className="border-b last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-medium hover:underline"
                          >
                            {order.orderNumber}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <Badge variant={status.variant} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                      </div>

                      {/* Order Items Preview */}
                      <div className="flex gap-1 mb-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xs bg-neutral-100"
                          >
                            {item.product.image ? (
                              <Image
                                src={item.product.image}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted" />
                            )}
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="h-10 w-10 shrink-0 rounded-xs bg-neutral-100 flex items-center justify-center text-xs text-muted-foreground">
                            +{order.items.length - 3}
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

            {orders.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" asChild className="w-full">
                  <Link href="/orders">View All Orders</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
