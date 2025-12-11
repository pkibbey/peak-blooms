"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { formatPhoneNumber } from "@/lib/phone"
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth"

interface ProfileFormProps {
  user: {
    id: string
    name: string | null
    email: string
    phone?: string | null
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success("Profile updated successfully")
        router.refresh()
      } else {
        const responseData = await response.json()
        form.setError("root", { message: responseData.error || "Failed to update profile" })
      }
    } catch (err) {
      form.setError("root", { message: "An error occurred. Please try again." })
      console.error(err)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        {/* Email (read-only, verified by Google) */}
        <FormItem>
          <FormLabel>Email</FormLabel>
          <div className="rounded-md border border-border bg-muted px-3 py-2 text-sm">
            {user.email}
          </div>
          <p className="text-xs text-muted-foreground">
            Your email is verified by Google and cannot be changed.
          </p>
        </FormItem>

        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="tel"
                  placeholder="(555) 123-4567"
                  onBlur={(e) => {
                    if (e.target.value) {
                      const formatted = formatPhoneNumber(e.target.value)
                      field.onChange(formatted)
                    }
                    field.onBlur()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
