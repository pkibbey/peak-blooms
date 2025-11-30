import AddressManager from "@/components/site/AddressManager"
import BackLink from "@/components/site/BackLink"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

export default async function AddressesPage() {
  const user = await getCurrentUser()

  // User is guaranteed to exist due to layout auth check
  if (!user) return null

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })

  return (
    <>
      <BackLink href="/account" label="Account" />
      <div className="mb-8">
        <h1 className="heading-1">Delivery Addresses</h1>
        <p className="mt-2 text-muted-foreground">
          {addresses.length > 0
            ? `Manage your ${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`
            : "Add and manage your delivery addresses"}
        </p>
      </div>

      <AddressManager addresses={addresses} />
    </>
  )
}
