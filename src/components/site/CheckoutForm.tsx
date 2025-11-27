"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import AddressForm, {
  type AddressFormData,
  emptyAddress,
  validateAddress,
} from "@/components/site/AddressForm"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { IconMapPin } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface CartProduct {
  id: string
  name: string
  slug: string
  image: string | null
}

interface CartVariant {
  id: string
  price: number
  stemLength: number | null
  countPerBunch: number | null
}

interface CartItem {
  id: string
  productId: string
  productVariantId: string | null
  quantity: number
  product: CartProduct
  productVariant: CartVariant | null
}

interface CartData {
  id: string
  items: CartItem[]
  total: number
}

interface SavedAddress {
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
}

interface CheckoutFormProps {
  cart: CartData
  savedAddresses: SavedAddress[]
  userEmail: string
}

export default function CheckoutForm({ cart, savedAddresses, userEmail }: CheckoutFormProps) {
  const router = useRouter()

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.length > 0 ? savedAddresses[0].id : "new"
  )
  const [shippingAddress, setShippingAddress] = useState<AddressFormData>(() => {
    if (savedAddresses.length > 0) {
      const addr = savedAddresses[0]
      return {
        firstName: addr.firstName,
        lastName: addr.lastName,
        company: addr.company || "",
        street1: addr.street1,
        street2: addr.street2 || "",
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
      }
    }
    return emptyAddress
  })
  const [saveAddress, setSaveAddress] = useState(false)
  const [differentBilling, setDifferentBilling] = useState(false)
  const [billingAddress, setBillingAddress] = useState<AddressFormData>(emptyAddress)

  const [email, setEmail] = useState(userEmail)
  const [phone, setPhone] = useState("")
  const [notes, setNotes] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    if (addressId === "new") {
      setShippingAddress(emptyAddress)
      setSaveAddress(false)
    } else {
      const addr = savedAddresses.find((a) => a.id === addressId)
      if (addr) {
        setShippingAddress({
          firstName: addr.firstName,
          lastName: addr.lastName,
          company: addr.company || "",
          street1: addr.street1,
          street2: addr.street2 || "",
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
        })
      }
    }
  }

  const handleShippingChange = (field: keyof AddressFormData, value: string) => {
    setShippingAddress((prev) => ({ ...prev, [field]: value }))
    // If editing a saved address, switch to "new" mode
    if (selectedAddressId !== "new") {
      setSelectedAddressId("new")
    }
  }

  const handleBillingChange = (field: keyof AddressFormData, value: string) => {
    setBillingAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Validate email
    if (!email.trim()) {
      setError("Email is required")
      setIsSubmitting(false)
      return
    }

    // Validate shipping address
    const shippingError = validateAddress(shippingAddress)
    if (shippingError) {
      setError(`Shipping address: ${shippingError}`)
      setIsSubmitting(false)
      return
    }

    // Validate billing address if different
    if (differentBilling) {
      const billingError = validateAddress(billingAddress)
      if (billingError) {
        setError(`Billing address: ${billingError}`)
        setIsSubmitting(false)
        return
      }
    }

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: selectedAddressId !== "new" ? selectedAddressId : null,
          shippingAddress: selectedAddressId === "new" ? shippingAddress : null,
          saveShippingAddress: selectedAddressId === "new" && saveAddress,
          billingAddress: differentBilling ? billingAddress : null,
          email,
          phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to place order")
      }

      const order = await response.json()
      toast.success("Order placed successfully!")
      router.refresh() // Refresh to update cart count in nav
      router.push(`/orders/${order.id}`)
    } catch (err) {
      console.error("Checkout error:", err)
      setError(err instanceof Error ? err.message : "An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price)
  }

  const formatAddressPreview = (addr: SavedAddress) => {
    return `${addr.firstName} ${addr.lastName}, ${addr.street1}, ${addr.city}, ${addr.state} ${addr.zip}`
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Forms */}
      <div className="lg:col-span-2 space-y-8">
        {error && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}

        {/* Contact Information */}
        <div className="bg-white rounded-xs shadow-sm border p-6">
          <h2 className="text-lg font-semibold font-serif mb-4">Contact Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xs shadow-sm border p-6">
          <h2 className="text-lg font-semibold font-serif mb-4 flex items-center gap-2">
            <IconMapPin className="h-5 w-5" />
            Shipping Address
          </h2>

          {savedAddresses.length > 0 && (
            <div className="mb-4">
              <Label htmlFor="savedAddress">Select Address</Label>
              <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select an address" />
                </SelectTrigger>
                <SelectContent>
                  {savedAddresses.map((addr) => (
                    <SelectItem key={addr.id} value={addr.id}>
                      {formatAddressPreview(addr)}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">Enter a new address</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <AddressForm address={shippingAddress} onChange={handleShippingChange} />

          {selectedAddressId === "new" && (
            <div className="flex items-center gap-2 mt-4">
              <Checkbox
                id="saveAddress"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
              />
              <Label htmlFor="saveAddress" className="cursor-pointer text-sm">
                Save this address for future orders
              </Label>
            </div>
          )}
        </div>

        {/* Billing Address */}
        <div className="bg-white rounded-xs shadow-sm border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Checkbox
              id="differentBilling"
              checked={differentBilling}
              onChange={(e) => setDifferentBilling(e.target.checked)}
            />
            <Label htmlFor="differentBilling" className="cursor-pointer font-semibold">
              Billing address is different from shipping
            </Label>
          </div>

          {differentBilling && (
            <div className="pt-2">
              <AddressForm
                address={billingAddress}
                onChange={handleBillingChange}
                idPrefix="billing"
                required={differentBilling}
              />
            </div>
          )}
        </div>

        {/* Order Notes */}
        <div className="bg-white rounded-xs shadow-sm border p-6">
          <h2 className="text-lg font-semibold font-serif mb-4">Order Notes (optional)</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Special instructions for your order..."
          />
        </div>
      </div>

      {/* Right Column - Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xs shadow-sm border p-6 sticky top-24">
          <h2 className="text-lg font-semibold font-serif mb-4">Order Summary</h2>

          {/* Cart Items */}
          <div className="space-y-4 mb-4">
            {cart.items.map((item) => {
              const price = item.productVariant?.price ?? 0
              const lineTotal = price * item.quantity

              return (
                <div key={item.id} className="flex gap-3">
                  <div className="relative h-16 w-16 shrink-0">
                    <div className="h-full w-full overflow-hidden rounded-xs bg-neutral-100">
                      {item.product.image ? (
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover rounded-xs"
                          sizes="64px"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted" />
                      )}
                    </div>
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {item.quantity}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.product.name}</p>
                    {item.productVariant && (
                      <p className="text-xs text-muted-foreground">
                        {[
                          item.productVariant.stemLength
                            ? `${item.productVariant.stemLength}cm`
                            : null,
                          item.productVariant.countPerBunch
                            ? `${item.productVariant.countPerBunch} stems`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </p>
                    )}
                  </div>
                  <p className="text-sm font-medium">{formatPrice(lineTotal)}</p>
                </div>
              )
            })}
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Subtotal ({cart.items.reduce((sum, item) => sum + item.quantity, 0)} items)
              </span>
              <span>{formatPrice(cart.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Calculated later</span>
            </div>
          </div>

          <div className="border-t my-4" />

          <div className="flex justify-between font-semibold text-lg mb-6">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            Place Order
          </Button>

          <div className="mt-4">
            <Button variant="outline" asChild className="w-full">
              <Link href="/cart">Return to Cart</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            By placing your order, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </form>
  )
}
