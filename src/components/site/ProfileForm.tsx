"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { updateProfileAction } from "@/app/actions/user-actions"
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
import type { SessionUser } from "@/lib/types/users"
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth"

interface ProfileFormProps {
  user: SessionUser
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileAction(data)
      toast.success("Profile updated successfully")
      router.refresh()
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred. Please try again."
      form.setError("root", { message: errorMessage })
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
