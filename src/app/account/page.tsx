import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconCheckCircle, IconClock } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/current-user"
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
        <h1 className="heading-1">Account Settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile, addresses, and order history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Section */}
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="heading-3">Profile</h2>
                <p className="mt-2 text-sm text-muted-foreground">View your account details</p>
              </div>
              <div className="shrink-0">
                <Button asChild className="mt-2">
                  <Link prefetch={false} href="/account/profile">
                    View Profile
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="heading-3">Addresses</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {addressCount > 0
                    ? `You have ${addressCount} saved address${addressCount === 1 ? "" : "es"}`
                    : "Manage your delivery addresses"}
                </p>
              </div>
              <div className="shrink-0">
                <Button asChild className="mt-2">
                  <Link prefetch={false} href="/account/addresses">
                    Manage Addresses
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Order History Section */}
          <div className="rounded-lg border border-border p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="heading-3">Order History</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {orderCount > 0
                    ? `You have ${orderCount} order${orderCount === 1 ? "" : "s"}`
                    : "View your order history"}
                </p>
              </div>
              <div className="shrink-0">
                <Button asChild className="mt-2">
                  <Link prefetch={false} href="/account/order-history">
                    View Order History
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Account Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border p-6 sticky top-24">
            <h2 className="heading-4 mb-3">Account Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <div className="flex items-center gap-2 mt-1">
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
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
