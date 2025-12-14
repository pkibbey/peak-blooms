"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPhoneNumber } from "@/lib/phone"
import type { AddressFormData } from "@/lib/validations/address"

export function validateAddress(addr: AddressFormData): string | null {
  if (!addr.firstName.trim()) return "First name is required"
  if (!addr.lastName.trim()) return "Last name is required"
  if (!addr.company.trim()) return "Company name is required"
  if (!addr.street1.trim()) return "Street address is required"
  if (!addr.city.trim()) return "City is required"
  if (!addr.state.trim()) return "State is required"
  if (!addr.zip.trim()) return "ZIP code is required"
  if (!addr.phone.trim()) return "Phone number is required"
  return null
}

interface AddressFormProps {
  address: AddressFormData
  onChange: (field: keyof AddressFormData, value: string) => void
  idPrefix?: string
  disabled?: boolean
  required?: boolean
}

export default function AddressForm({
  address,
  onChange,
  idPrefix = "",
  disabled = false,
  required = true,
}: AddressFormProps) {
  const id = (field: string) =>
    idPrefix ? `${idPrefix}${field.charAt(0).toUpperCase() + field.slice(1)}` : field

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={id("firstName")}>First Name {required && "*"}</Label>
          <Input
            id={id("firstName")}
            type="text"
            required={required}
            value={address.firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            placeholder="First name"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("lastName")}>Last Name {required && "*"}</Label>
          <Input
            id={id("lastName")}
            type="text"
            required={required}
            value={address.lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            placeholder="Last name"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("company")}>Company {required && "*"}</Label>
        <Input
          id={id("company")}
          type="text"
          required={required}
          value={address.company}
          onChange={(e) => onChange("company", e.target.value)}
          placeholder="Company name"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("phone")}>Phone {required && "*"}</Label>
        <Input
          id={id("phone")}
          type="tel"
          required={required}
          value={address.phone}
          onChange={(e) => onChange("phone", e.target.value)}
          onBlur={(e) => {
            if (e.target.value) {
              const formatted = formatPhoneNumber(e.target.value)
              onChange("phone", formatted)
            }
          }}
          placeholder="(555) 123-4567"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("street1")}>Street Address {required && "*"}</Label>
        <Input
          id={id("street1")}
          type="text"
          required={required}
          value={address.street1}
          onChange={(e) => onChange("street1", e.target.value)}
          placeholder="123 Main St"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={id("street2")}>Apartment, suite, etc. (optional)</Label>
        <Input
          id={id("street2")}
          type="text"
          value={address.street2}
          onChange={(e) => onChange("street2", e.target.value)}
          placeholder="Apt 4B"
          disabled={disabled}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={id("city")}>City {required && "*"}</Label>
          <Input
            id={id("city")}
            type="text"
            required={required}
            value={address.city}
            onChange={(e) => onChange("city", e.target.value)}
            placeholder="City"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("state")}>State {required && "*"}</Label>
          <Input
            id={id("state")}
            type="text"
            required={required}
            value={address.state}
            onChange={(e) => onChange("state", e.target.value)}
            placeholder="State"
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={id("zip")}>ZIP Code {required && "*"}</Label>
          <Input
            id={id("zip")}
            type="text"
            required={required}
            value={address.zip}
            onChange={(e) => onChange("zip", e.target.value)}
            placeholder="12345"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}
