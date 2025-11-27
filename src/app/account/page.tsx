import Link from "next/link"
import { Button } from "@/components/ui/button"
import { IconMapPin, IconPackage, IconUser } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/auth-utils"
import { db } from "@/lib/db"

export default async function AccountPage() {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to layout auth check
  if (!user) return null

  // Count total orders for display
  const orderCount = await db.order.count({
    where: { userId: user.id },
  })

  // Count addresses
  const addressCount = await db.address.count({
    where: { userId: user.id },
  })

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-serif">My Account</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, addresses, and view your orders
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-xs border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <IconUser className="h-5 w-5" />
            <h2 className="text-lg font-semibold font-serif">Profile</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            View your account details and membership status
          </p>
          <Button asChild size="sm">
            <Link href="/account/profile">View Profile</Link>
          </Button>
        </div>

        {/* Addresses Card */}
        <div className="rounded-xs border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <IconMapPin className="h-5 w-5" />
            <h2 className="text-lg font-semibold font-serif">Addresses</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {addressCount > 0
              ? `You have ${addressCount} saved address${addressCount === 1 ? "" : "es"}`
              : "Manage your delivery addresses"}
          </p>
          <Button asChild size="sm">
            <Link href="/account/addresses">Manage Addresses</Link>
          </Button>
        </div>

        {/* Orders Card */}
        <div className="rounded-xs border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <IconPackage className="h-5 w-5" />
            <h2 className="text-lg font-semibold font-serif">Orders</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {orderCount > 0
              ? `You have ${orderCount} order${orderCount === 1 ? "" : "s"}`
              : "View your order history"}
          </p>
          <Button asChild size="sm">
            <Link href="/account/orders">View Orders</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
