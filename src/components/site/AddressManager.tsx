"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import AddressCard, { type Address } from "@/components/site/AddressCard"
import AddressForm, { validateAddress } from "@/components/site/AddressForm"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconPlus, IconX } from "@/components/ui/icons"
import { Label } from "@/components/ui/label"
import { type AddressFormData, emptyAddress } from "@/lib/validations/address"

interface AddressManagerProps {
  addresses: Address[]
}

export default function AddressManager({ addresses }: AddressManagerProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState<Address | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(emptyAddress)
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showAllAddresses, setShowAllAddresses] = useState(false)

  const handleAddNew = () => {
    setIsEditing(null)
    setFormData(emptyAddress)
    setSetAsDefault(addresses.length === 0) // First address should be default
    setIsAdding(true)
  }

  const handleEdit = (address: Address) => {
    setIsEditing(address)
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company || "",
      street1: address.street1,
      street2: address.street2 || "",
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country,
    })
    setSetAsDefault(address.isDefault)
    setIsAdding(true)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setIsEditing(null)
    setFormData(emptyAddress)
    setSetAsDefault(false)
  }

  const handleChange = (field: keyof AddressFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    const error = validateAddress(formData)
    if (error) {
      toast.error(error)
      return
    }

    setIsSaving(true)
    try {
      const url = isEditing ? `/api/users/addresses/${isEditing.id}` : "/api/users/addresses"
      const method = isEditing ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          isDefault: setAsDefault,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save address")
      }

      toast.success(isEditing ? "Address updated" : "Address added")
      handleCancel()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save address")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Default Address Display (Minimal) */}
      {addresses.length > 0 && !isAdding && (
        <div className="space-y-3">
          {(() => {
            const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0]
            return (
              <div>
                <div className="bg-background rounded-xs shadow-sm border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">Default Address</p>
                      <p className="font-medium">
                        {defaultAddress.firstName} {defaultAddress.lastName}
                      </p>
                      <p className="text-sm">{defaultAddress.company}</p>
                      <p className="text-sm">
                        {defaultAddress.street1}
                        {defaultAddress.street2 && `, ${defaultAddress.street2}`}
                      </p>
                      <p className="text-sm">
                        {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(defaultAddress)}>
                      Edit
                    </Button>
                  </div>
                </div>
                {addresses.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllAddresses(!showAllAddresses)}
                    className="w-full mt-2"
                  >
                    {showAllAddresses ? "Hide" : "Show"} Other Addresses ({addresses.length - 1})
                  </Button>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* Other Addresses (Hidden by default) */}
      {addresses.length > 1 && showAllAddresses && !isAdding && (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses
            .filter((a) => !a.isDefault || addresses.every((addr) => !addr.isDefault))
            .slice(1)
            .map((address) => (
              <AddressCard key={address.id} address={address} onEdit={handleEdit} />
            ))}
        </div>
      )}

      {/* No Addresses */}
      {addresses.length === 0 && !isAdding && (
        <p className="text-muted-foreground text-sm">
          No saved addresses yet. Add an address to make checkout faster.
        </p>
      )}

      {/* Add/Edit Form */}
      {isAdding ? (
        <div className="bg-background rounded-xs shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="heading-3">{isEditing ? "Edit Address" : "Add New Address"}</h3>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <IconX className="h-4 w-4" />
            </Button>
          </div>

          <AddressForm address={formData} onChange={handleChange} disabled={isSaving} />

          <div className="flex items-center gap-2 mt-4">
            <Checkbox
              id="setAsDefault"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
              disabled={isSaving}
            />
            <Label htmlFor="setAsDefault" className="cursor-pointer text-sm">
              Set as default address
            </Label>
          </div>

          <div className="flex gap-3 mt-6">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : isEditing ? "Update Address" : "Add Address"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={handleAddNew}>
          <IconPlus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      )}
    </div>
  )
}
