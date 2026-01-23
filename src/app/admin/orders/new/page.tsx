import OrderForm from "@/components/admin/OrderForm"
import BackLink from "@/components/site/BackLink"
import type { AddressModel } from "@/generated/models"
import { getTrackedDb } from "@/lib/db"

export const metadata = {
  title: "Create New Order",
}

export default async function NewOrderPage() {
  const db = getTrackedDb(true)

  const [users, products, addresses] = await Promise.all([
    db.user.findMany({
      orderBy: { email: "asc" },
    }),
    db.product.findMany({
      orderBy: { name: "asc" },
    }),
    db.address.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  // Cast addresses to the correct type - addresses can have null user
  const castedAddresses = addresses as (AddressModel & {
    user: { id: string; name: string | null } | null
  })[]

  return (
    <>
      <BackLink href="/admin/orders" label="Orders" />
      <div className="mb-8">
        <h1 className="heading-1">Create New Order</h1>
        <p className="mt-2 text-muted-foreground">Manually create an order for a customer</p>
      </div>

      <div className="rounded-lg border border-border p-6">
        <OrderForm users={users} products={products} addresses={castedAddresses} />
      </div>
    </>
  )
}
