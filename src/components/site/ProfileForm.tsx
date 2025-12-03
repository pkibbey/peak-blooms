"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
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
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth"

interface ProfileFormProps {
  user: {
    id: string
    name: string | null
    email: string
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email,
    },
  })

  // Show success message when email is verified via callback
  useEffect(() => {
    if (searchParams.get("emailVerified") === "true") {
      toast.success("Your email address has been successfully verified and updated!")
      router.refresh()
    }
  }, [searchParams, router])

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const responseData = await response.json()

        // If email was changed, show verification message
        if (data.email !== user.email && responseData.requiresVerification) {
          toast.success("Check your new email for a verification link to confirm the change")
        } else {
          toast.success("Profile updated successfully")
        }

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

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="your@email.com" />
              </FormControl>
              <FormMessage />
              {field.value !== user.email && (
                <p className="text-sm text-muted-foreground">
                  If you change your email, we'll send a verification link to your new address and a
                  security notice to your current email.
                </p>
              )}
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
