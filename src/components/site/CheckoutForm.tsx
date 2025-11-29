"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import AddressFields, { emptyAddress } from "@/components/site/AddressFields"
import { CheckoutOrderItem } from "@/components/site/CheckoutOrderItem"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { IconMapPin } from "@/components/ui/icons"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatPrice } from "@/lib/utils"
import { type CheckoutFormData, checkoutSchema } from "@/lib/validations/checkout"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.length > 0 ? savedAddresses[0].id : "new"
  )

  const getInitialShippingAddress = () => {
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
  }

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: userEmail,
      phone: "",
      notes: "",
      selectedAddressId: selectedAddressId,
      shippingAddress: getInitialShippingAddress(),
      saveShippingAddress: false,
      differentBilling: false,
      billingAddress: emptyAddress,
    },
  })

  const differentBilling = form.watch("differentBilling")

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    form.setValue("selectedAddressId", addressId)

    if (addressId === "new") {
      form.setValue("shippingAddress", emptyAddress)
      form.setValue("saveShippingAddress", false)
    } else {
      const addr = savedAddresses.find((a) => a.id === addressId)
      if (addr) {
        form.setValue("shippingAddress", {
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

  // When shipping address fields change, switch to "new" mode
  const handleShippingFieldChange = () => {
    if (selectedAddressId !== "new") {
      setSelectedAddressId("new")
      form.setValue("selectedAddressId", "new")
    }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shippingAddressId: selectedAddressId !== "new" ? selectedAddressId : null,
          shippingAddress: selectedAddressId === "new" ? data.shippingAddress : null,
          saveShippingAddress: selectedAddressId === "new" && data.saveShippingAddress,
          billingAddress: data.differentBilling ? data.billingAddress : null,
          email: data.email,
          phone: data.phone?.trim() || null,
          notes: data.notes?.trim() || null,
        }),
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.error || "Failed to place order")
      }

      const order = await response.json()
      toast.success("Order placed successfully!")
      router.refresh()
      router.push(`/account/order-history/${order.id}`)
    } catch (err) {
      console.error("Checkout error:", err)
      form.setError("root", {
        message: err instanceof Error ? err.message : "An error occurred. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatAddressPreview = (addr: SavedAddress) => {
    return `${addr.firstName} ${addr.lastName}, ${addr.street1}, ${addr.city}, ${addr.state} ${addr.zip}`
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={handleShippingFieldChange}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          {form.formState.errors.root && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Contact Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="your@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" placeholder="(555) 123-4567" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                <FormLabel htmlFor="savedAddress">Select Address</FormLabel>
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

            <AddressFields fieldPrefix="shippingAddress." />

            {selectedAddressId === "new" && (
              <FormField
                control={form.control}
                name="saveShippingAddress"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 mt-4 space-y-0">
                    <FormControl>
                      <Checkbox
                        id="saveAddress"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                    </FormControl>
                    <FormLabel htmlFor="saveAddress" className="cursor-pointer text-sm font-normal">
                      Save this address for future orders
                    </FormLabel>
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Billing Address */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <FormField
              control={form.control}
              name="differentBilling"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 mb-4 space-y-0">
                  <FormControl>
                    <Checkbox
                      id="differentBilling"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <FormLabel
                    htmlFor="differentBilling"
                    className="cursor-pointer font-semibold font-normal"
                  >
                    Billing address is different from shipping
                  </FormLabel>
                </FormItem>
              )}
            />

            {differentBilling && (
              <div className="pt-2">
                <AddressFields fieldPrefix="billingAddress." />
              </div>
            )}
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-xs shadow-sm border p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Order Notes (optional)</h2>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Special instructions for your order..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xs shadow-sm border p-6 sticky top-24">
            <h2 className="text-lg font-semibold font-serif mb-4">Order Summary</h2>

            {/* Cart Items */}
            <div className="space-y-4 mb-4">
              {cart.items.map((item) => (
                <CheckoutOrderItem key={item.id} item={item} />
              ))}
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
              {isSubmitting ? "Placing Order..." : "Place Order"}
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
    </Form>
  )
}
