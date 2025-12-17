"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { deleteAddressAction, updateAddressAction } from "@/app/actions/user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { IconEdit, IconStar, IconTrash } from "@/components/ui/icons"

export interface Address {
  id: string
  firstName: string
  lastName: string
  company: string | null
  street1: string
  street2: string | null
  city: string
  state: string
  zip: string
  country: string
  email: string
  phone: string
  isDefault: boolean
}

interface AddressCardProps {
  address: Address
  onEdit: (address: Address) => void
}

export default function AddressCard({ address, onEdit }: AddressCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this address?")) return

    setIsDeleting(true)
    try {
      await deleteAddressAction(address.id)
      toast.success("Address deleted")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete address")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async () => {
    if (address.isDefault) return

    setIsSettingDefault(true)
    try {
      await updateAddressAction(address.id, { isDefault: true })
      toast.success("Default address updated")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to set default address")
    } finally {
      setIsSettingDefault(false)
    }
  }

  return (
    <div className="bg-background rounded-xs shadow-sm border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium">
              {address.firstName} {address.lastName}
            </p>
            {address.isDefault && (
              <Badge variant="secondary" className="text-xs">
                <IconStar className="h-3 w-3 mr-1 fill-current" />
                Default
              </Badge>
            )}
          </div>
          {address.company && <p className="text-sm text-muted-foreground">{address.company}</p>}
          <p className="text-sm text-muted-foreground">{address.street1}</p>
          {address.street2 && <p className="text-sm text-muted-foreground">{address.street2}</p>}
          <p className="text-sm text-muted-foreground">
            {address.city}, {address.state} {address.zip}
          </p>
          <p className="text-sm text-muted-foreground">{address.country}</p>
          <p className="text-sm text-muted-foreground font-medium mt-2">{address.phone}</p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(address)}>
            <IconEdit className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={isDeleting}>
            <IconTrash className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </div>

      {!address.isDefault && (
        <Button
          variant="link"
          size="sm"
          className="mt-2 p-0 h-auto"
          onClick={handleSetDefault}
          disabled={isSettingDefault}
        >
          Set as default
        </Button>
      )}
    </div>
  )
}
