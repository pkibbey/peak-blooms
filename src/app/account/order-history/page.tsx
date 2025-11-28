import Link from "next/link"
import BackLink from "@/components/site/BackLink"
import OrderHistoryItem from "@/components/site/OrderHistoryItem"
import { Button } from "@/components/ui/button"
import { IconPackage } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

export default async function OrderHistoryPage() {
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

  return (
    <>
      <BackLink href="/account" label="Account" />
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">Order History</h1>
        <p className="mt-2 text-muted-foreground">
          {orders.length > 0
            ? `You have ${orders.length} order${orders.length === 1 ? "" : "s"}`
            : "View and manage your orders"}
        </p>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderHistoryItem key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <IconPackage className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No orders yet</p>
          <Button asChild>
            <Link href="/shop">Browse Products</Link>
          </Button>
        </div>
      )}
    </>
  )
}
