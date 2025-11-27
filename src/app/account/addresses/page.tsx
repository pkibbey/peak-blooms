import AddressManager from "@/components/site/AddressManager"
import BackLink from "@/components/site/BackLink"
import { IconMapPin } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/auth-utils"
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
      <div className="bg-white rounded-xs shadow-sm border p-6">
      <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
        <IconMapPin className="h-5 w-5" />
        Delivery Addresses
      </h2>
      <AddressManager addresses={addresses} />
    </div>
    </>
  )
}
