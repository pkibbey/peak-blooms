"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { adminCreateOrderAction } from "@/app/actions/orders"
import OrderProductsPicker from "@/components/admin/OrderProductsPicker"
import { UsersForm } from "@/components/admin/UsersForm"
import { ProductCard } from "@/components/site/ProductCard"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectPositioner,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { AddressModel, ProductModel } from "@/generated/models"
import { toAppErrorClient } from "@/lib/error-utils"
import type { UserForAdmin } from "@/lib/query-types"

interface OrderFormProps {
  users: UserForAdmin[]
  products: ProductModel[]
  addresses: (AddressModel & { user: { id: string; name: string | null } | null })[]
}

interface OrderFormValues {
  userId: string
  deliveryAddressId: string | null
  useNewAddress: boolean
  deliveryAddress: {
    firstName: string
    lastName: string
    company: string
    street1: string
    street2: string
    city: string
    state: string
    zip: string
    country: string
    email: string
    phone: string
  } | null
  items: Array<{
    productId: string
    quantity: number
    price: string
  }>
  notes: string
}

export default function OrderForm({ users, products, addresses }: OrderFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localUsers, setLocalUsers] = useState<UserForAdmin[]>(users)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  const form = useForm<OrderFormValues>({
    defaultValues: {
      userId: "",
      deliveryAddressId: null,
      useNewAddress: false,
      deliveryAddress: null,
      items: [],
      notes: "",
    },
  })

  const { append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const selectedUserId = form.watch("userId")
  const useNewAddress = form.watch("useNewAddress")
  const items = form.watch("items")

  // Filter addresses for the selected user
  const userAddresses = selectedUserId
    ? addresses.filter((addr) => addr.userId === selectedUserId)
    : []

  // When the selected user changes, automatically:
  // - select their default address if one exists
  // - auto-enable "useNewAddress" when the selected user has NO saved addresses
  // - clear any deliveryAddressId that doesn't belong to the selected user
  // Do not override when "useNewAddress" is already set by the admin (except for zero-address case).
  useEffect(() => {
    if (!selectedUserId) {
      form.setValue("deliveryAddressId", null)
      return
    }

    // If the selected user has no addresses, force the admin into "use new address" mode.
    if (userAddresses.length === 0) {
      form.setValue("useNewAddress", true)
      form.setValue("deliveryAddressId", null)
      // clear any existing deliveryAddress fields
      form.setValue("deliveryAddress", null)
      return
    }

    // If the admin already chose to use a new address, don't override their choice.
    if (form.getValues("useNewAddress")) return

    const currentDeliveryId = form.getValues("deliveryAddressId")
    const belongsToSelected = !!userAddresses.find((a) => a.id === currentDeliveryId)
    if (belongsToSelected) return

    const defaultAddr = userAddresses.find((a) => a.isDefault)
    form.setValue("deliveryAddressId", defaultAddr ? defaultAddr.id : null)
  }, [selectedUserId, userAddresses, form.getValues, form.setValue])

  async function onSubmit(values: OrderFormValues) {
    setIsSubmitting(true)

    try {
      // Validate that at least one item is provided
      if (!values.items || values.items.length === 0) {
        toast.error("At least one item is required")
        return
      }

      // Build the submission data
      const isUsingNewAddress = useNewAddress || userAddresses.length === 0
      const submitData = {
        userId: values.userId,
        deliveryAddressId: isUsingNewAddress ? null : values.deliveryAddressId,
        deliveryAddress: isUsingNewAddress ? values.deliveryAddress : null,
        items: values.items.map((item) => ({
          productId: item.productId,
          quantity: parseInt(String(item.quantity), 10),
          price: item.price ? parseFloat(item.price) : undefined,
        })),
        notes: values.notes || null,
      }

      const result = await adminCreateOrderAction(submitData)

      if (!result.success) {
        toast.error(result.error || "Failed to create order")
        return
      }

      toast.success("Order created successfully")
      router.push("/admin/orders")
      router.refresh()
    } catch (error) {
      toAppErrorClient(error, "Failed to create order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User Selection */}
        <FormField
          control={form.control}
          name="userId"
          rules={{ required: "User is required" }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-required>
                    {/* show friendly label (name or email) in trigger instead of raw id */}
                    <span
                      data-slot="select-value"
                      className={!field.value ? "text-muted-foreground" : "truncate"}
                    >
                      {field.value
                        ? localUsers.find((u) => u.id === field.value)?.name ||
                          localUsers.find((u) => u.id === field.value)?.email ||
                          field.value
                        : "Select a customer"}
                    </span>
                    {/* keep the real Select value for accessibility/internal state but hide it visually */}
                    <SelectValue className="sr-only" />
                  </SelectTrigger>
                </FormControl>
                <SelectPositioner>
                  <SelectContent>
                    {localUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPositioner>
              </Select>
              <div className="mt-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setIsUserModalOpen(true)}
                >
                  Add new customer
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create new customer</DialogTitle>
            </DialogHeader>
            <UsersForm
              onSuccess={(user) => {
                setLocalUsers((prev) => [...prev, user])
                form.setValue("userId", user.id)
                setIsUserModalOpen(false)
              }}
              onCancel={() => setIsUserModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Delivery Address Selection */}
        {selectedUserId && (
          <div className="space-y-4">
            {userAddresses.length > 0 && (
              <FormField
                control={form.control}
                name="useNewAddress"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormLabel>Use new address</FormLabel>
                  </FormItem>
                )}
              />
            )}

            {!useNewAddress && userAddresses.length > 0 && (
              <FormField
                control={form.control}
                name="deliveryAddressId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value || null)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an address" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectPositioner>
                        <SelectContent>
                          {userAddresses.map((addr) => (
                            <SelectItem key={addr.id} value={addr.id}>
                              {addr.company}, {addr.street1}, {addr.city}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </SelectPositioner>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {(useNewAddress || userAddresses.length === 0) && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress.firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAddress.lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deliveryAddress.company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress.street1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress.street2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apartment, Suite, etc.</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAddress.state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="deliveryAddress.zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="deliveryAddress.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryAddress.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Order Items *</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document
                  .getElementById("order-products-picker")
                  ?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
            >
              Add Item
            </Button>
          </div>

          {/* ProductCards for items with a selected product — appear ABOVE the picker (match edit page) */}
          {items?.some((it) => it.productId) && (
            <div className="space-y-3">
              {items.map((it, i) => {
                if (!it?.productId) return null
                const product = products.find((p) => p.id === it.productId)
                if (!product) return null

                return (
                  <ProductCard
                    key={`${it.productId}-${i}`}
                    product={product}
                    quantity={Number(it.quantity) || 1}
                    imageSize="sm"
                    showQuantityControl={true}
                    onQuantityChange={(q) => form.setValue(`items.${i}.quantity`, q)}
                    onRemove={() => remove(i)}
                    isUpdating={isSubmitting}
                  />
                )
              })}
            </div>
          )}

          <div id="order-products-picker">
            <OrderProductsPicker
              products={products}
              onAdd={(items) => {
                const currentItems = form.getValues("items") || []

                for (const sel of items) {
                  const existingIndex = currentItems.findIndex(
                    (it) => it.productId === sel.productId && it.productId !== ""
                  )

                  if (existingIndex !== -1) {
                    const currentQty = Number(currentItems[existingIndex].quantity || 0)
                    form.setValue(`items.${existingIndex}.quantity`, currentQty + sel.quantity)
                  } else {
                    append({ productId: sel.productId, quantity: sel.quantity, price: "" })
                  }
                }
              }}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Order Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Special instructions or notes for this order..."
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Order"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
