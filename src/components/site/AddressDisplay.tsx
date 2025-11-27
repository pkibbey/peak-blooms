interface Address {
  firstName: string
  lastName: string
  company?: string | null
  street1: string
  street2?: string | null
  city: string
  state: string
  zip: string
  country: string
}

interface AddressDisplayProps {
  address: Address
  className?: string
}

export function AddressDisplay({ address, className }: AddressDisplayProps) {
  return (
    <address className={`not-italic text-sm text-muted-foreground space-y-1 ${className ?? ""}`}>
      <p className="font-medium text-foreground">
        {address.firstName} {address.lastName}
      </p>
      {address.company && <p>{address.company}</p>}
      <p>{address.street1}</p>
      {address.street2 && <p>{address.street2}</p>}
      <p>
        {address.city}, {address.state} {address.zip}
      </p>
      <p>{address.country}</p>
    </address>
  )
}
