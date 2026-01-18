"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { createOrderAction } from "@/app/actions/orders"
import AddressFields from "@/components/site/AddressFields"
import { CheckoutOrderItem } from "@/components/site/CheckoutOrderItem"
import { MarketPriceIndicator } from "@/components/site/MarketPriceIndicator"
import { MarketPriceWarning } from "@/components/site/MarketPriceWarning"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { calculateCartTotal } from "@/lib/cart-utils"
import type { CartResponse } from "@/lib/query-types"
import { emptyAddress } from "@/lib/validations/address"
import { type CheckoutFormData, checkoutSchema } from "@/lib/validations/checkout"

interface SavedAddress {
  id: string
  firstName: string
  lastName: string
  company: string
  street1: string
  street2: string | null
  city: string
  state: string
  zip: string
  country: string
  email: string
  phone: string
}

interface CheckoutFormProps {
  cart: CartResponse
  savedAddresses: SavedAddress[]
}

export default function CheckoutForm({ cart, savedAddresses }: CheckoutFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    savedAddresses.length > 0 ? savedAddresses[0].id : "new"
  )
  const total = calculateCartTotal(cart.items)

  const getInitialDeliveryAddress = () => {
    if (savedAddresses.length > 0) {
      const addr = savedAddresses[0]
      return {
        firstName: addr.firstName,
        lastName: addr.lastName,
        company: addr.company,
        street1: addr.street1,
        street2: addr.street2 || "",
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
        email: addr.email,
        phone: addr.phone,
      }
    }
    return emptyAddress
  }

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      notes: "",
      selectedAddressId: selectedAddressId,
      deliveryAddress: getInitialDeliveryAddress(),
      saveDeliveryAddress: true,
    },
  })

  const handleAddressSelect = (addressId: string | null) => {
    if (addressId === null) return

    setSelectedAddressId(addressId)
    form.setValue("selectedAddressId", addressId)

    if (addressId === "new") {
      form.setValue("deliveryAddress", emptyAddress)
      form.setValue("saveDeliveryAddress", false)
    } else {
      const addr = savedAddresses.find((a) => a.id === addressId)
      if (addr) {
        form.setValue("deliveryAddress", {
          firstName: addr.firstName,
          lastName: addr.lastName,
          company: addr.company,
          street1: addr.street1,
          street2: addr.street2 || "",
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
          email: addr.email,
          phone: addr.phone,
        })
      }
    }
  }

  // When delivery address fields change, check if it matches a saved address
  const handleDeliveryFieldChange = () => {
    const currentAddress = form.getValues("deliveryAddress")

    // Check if the current address matches any saved address
    const matchingSavedAddress = savedAddresses.find((saved) => {
      return (
        saved.firstName === currentAddress.firstName &&
        saved.lastName === currentAddress.lastName &&
        saved.company === currentAddress.company &&
        saved.street1 === currentAddress.street1 &&
        saved.street2 === (currentAddress.street2 || null) &&
        saved.city === currentAddress.city &&
        saved.state === currentAddress.state &&
        saved.zip === currentAddress.zip &&
        saved.country === currentAddress.country &&
        saved.email === currentAddress.email &&
        saved.phone === currentAddress.phone
      )
    })

    if (matchingSavedAddress && selectedAddressId !== matchingSavedAddress.id) {
      // If it matches a saved address, select that address
      setSelectedAddressId(matchingSavedAddress.id)
      form.setValue("selectedAddressId", matchingSavedAddress.id)
    } else if (!matchingSavedAddress && selectedAddressId !== "new") {
      // If it doesn't match any saved address, switch to "new" mode
      setSelectedAddressId("new")
      form.setValue("selectedAddressId", "new")
    }
  }

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true)

    try {
      // Determine if we should save the address (prevent duplicates)
      let shouldSaveAddress = false
      if (selectedAddressId === "new" && data.saveDeliveryAddress) {
        // Check if this exact address already exists
        const isDuplicate = savedAddresses.some((saved) => {
          return (
            saved.firstName === data.deliveryAddress.firstName &&
            saved.lastName === data.deliveryAddress.lastName &&
            saved.company === data.deliveryAddress.company &&
            saved.street1 === data.deliveryAddress.street1 &&
            saved.street2 === (data.deliveryAddress.street2 || null) &&
            saved.city === data.deliveryAddress.city &&
            saved.state === data.deliveryAddress.state &&
            saved.zip === data.deliveryAddress.zip &&
            saved.country === data.deliveryAddress.country &&
            saved.email === data.deliveryAddress.email &&
            saved.phone === data.deliveryAddress.phone
          )
        })
        shouldSaveAddress = !isDuplicate
      }

      await createOrderAction({
        deliveryAddressId: selectedAddressId !== "new" ? selectedAddressId : null,
        deliveryAddress: selectedAddressId === "new" ? data.deliveryAddress : null,
        saveDeliveryAddress: shouldSaveAddress,
        notes: data.notes?.trim() || null,
      })

      toast.success("Order placed successfully!")

      // Refresh the entire page to update cart and all server components
      // This ensures the cart badge is cleared and order history is updated
      router.push("/account/order-history")
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
    return `${addr.firstName} ${addr.lastName} / ${addr.company}, ${addr.street1}, ${addr.city}, ${addr.state} ${addr.zip}`
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onChange={handleDeliveryFieldChange}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-8">
          {form.formState.errors.root && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          {/* Delivery Address */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4 flex items-center gap-2">Delivery Address</h2>

            {savedAddresses.length > 0 && (
              <FormField
                control={form.control}
                name="selectedAddressId"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Select Address</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleAddressSelect}
                      items={savedAddresses.map((address) => ({
                        label: formatAddressPreview(address),
                        value: address.id,
                      }))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectPositioner alignItemWithTrigger>
                        <SelectContent>
                          {savedAddresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              {formatAddressPreview(addr)}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">Enter a new address</SelectItem>
                        </SelectContent>
                      </SelectPositioner>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedAddressId === "new" && <AddressFields fieldPrefix="deliveryAddress." />}

            {selectedAddressId === "new" && (
              <FormField
                control={form.control}
                name="saveDeliveryAddress"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 mt-4 space-y-0">
                    <FormControl>
                      <Checkbox
                        id="saveAddress"
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
          {/* Order Notes */}
          <div className="bg-background rounded-xs shadow-sm border p-6">
            <h2 className="heading-3 mb-4">Order Notes (optional)</h2>
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
          <div className="bg-background rounded-xs shadow-sm border p-6 sticky top-24">
            <h2 className="heading-3 mb-4">Order Summary</h2>

            <MarketPriceWarning
              showWarning={cart.items.some((item) => item.product?.price === 0)}
              className="mb-4"
            />

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
                <MarketPriceIndicator items={cart.items} total={total} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <MarketPriceIndicator items={cart.items} total={total} size="sm" />
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Button>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                nativeButton={false}
                render={
                  <Link prefetch={false} href="/cart">
                    Return to Cart
                  </Link>
                }
              />
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
