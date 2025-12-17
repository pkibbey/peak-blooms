import AddressManager from "@/components/site/AddressManager"
import type { AddressModel } from "@/generated/models"

interface AddressesCardProps {
  addresses: AddressModel[]
}

export default function AddressesCard({ addresses }: AddressesCardProps) {
  return (
    <div className="rounded-lg border border-border p-6">
      <div className="mb-6">
        <h2 className="heading-3">Delivery Addresses</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {addresses.length > 0
            ? `Manage your ${addresses.length} saved address${addresses.length === 1 ? "" : "es"}`
            : "Add and manage your delivery addresses"}
        </p>
      </div>
      <AddressManager addresses={addresses} />
    </div>
  )
}
