"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { toast } from "sonner"
import { adminCreateOrderAction } from "@/app/actions/orders"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { IconTrash } from "@/components/ui/icons"
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
import type { AddressModel, ProductModel, UserModel } from "@/generated/models"
import { toAppErrorClient } from "@/lib/error-utils"

interface OrderFormProps {
  users: UserModel[]
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

  const form = useForm<OrderFormValues>({
    defaultValues: {
      userId: "",
      deliveryAddressId: null,
      useNewAddress: false,
      deliveryAddress: null,
      items: [
        {
          productId: "",
          quantity: 1,
          price: "",
        },
      ],
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const selectedUserId = form.watch("userId")
  const useNewAddress = form.watch("useNewAddress")

  // Filter addresses for the selected user
  const userAddresses = selectedUserId
    ? addresses.filter((addr) => addr.userId === selectedUserId)
    : []

  async function onSubmit(values: OrderFormValues) {
    setIsSubmitting(true)

    try {
      // Validate that at least one item is provided
      if (!values.items || values.items.length === 0) {
        toast.error("At least one item is required")
        return
      }

      // Build the submission data
      const submitData = {
        userId: values.userId,
        deliveryAddressId: useNewAddress ? null : values.deliveryAddressId,
        deliveryAddress: useNewAddress ? values.deliveryAddress : null,
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectPositioner>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectPositioner>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Delivery Address Selection */}
        {selectedUserId && (
          <div className="space-y-4">
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
              onClick={() => append({ productId: "", quantity: 1, price: "" })}
            >
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.productId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectPositioner>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </SelectPositioner>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`items.${index}.price`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Leave empty for market price"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {fields.length > 1 && (
                <Button type="button" variant="destructive" size="sm" onClick={() => remove(index)}>
                  <IconTrash className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          ))}
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
