"use client"

import { useFormContext } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"

interface AddressFieldsProps {
  fieldPrefix?: string
  disabled?: boolean
}

/**
 * AddressFields is a fieldset component that integrates with a parent form's
 * React Hook Form context. It renders address input fields with validation.
 *
 * @param fieldPrefix - Optional prefix for field names (e.g., "shippingAddress." or "billingAddress.")
 * @param disabled - Whether the fields should be disabled
 *
 * Usage:
 * ```tsx
 * <FormProvider {...form}>
 *   <AddressFields fieldPrefix="shippingAddress." />
 * </FormProvider>
 * ```
 */
export default function AddressFields({ fieldPrefix = "", disabled = false }: AddressFieldsProps) {
  const { control } = useFormContext()

  const fieldName = (name: string) => `${fieldPrefix}${name}` as const

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={fieldName("firstName")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="First name" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={fieldName("lastName")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Last name" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name={fieldName("company")}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Company *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Company name" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={fieldName("street1")}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="123 Main St" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name={fieldName("street2")}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Apt 4B" disabled={disabled} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <FormField
          control={control}
          name={fieldName("city")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>City *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="City" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={fieldName("state")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>State *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="State" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={fieldName("zip")}
          render={({ field }) => (
            <FormItem>
              <FormLabel>ZIP Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="12345" disabled={disabled} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
