import Link from "next/link"
import { redirect } from "next/navigation"
import { OrderCard } from "@/components/site/OrderCard"
import { Button } from "@/components/ui/button"
import { IconShoppingBag } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

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
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  )
}
