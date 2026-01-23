"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { updateProfileAction } from "@/app/actions/user-actions"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toAppErrorClient } from "@/lib/error-utils"
import type { SessionUser } from "@/lib/query-types"
import { type ProfileFormData, profileSchema } from "@/lib/validations/auth"

interface ProfileFormProps {
  user: SessionUser
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const originalNameRef = useRef(user.name || "")

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || "",
    },
  })

  return (
    <Form {...form}>
      <form className="space-y-6">
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
                <Input
                  {...field}
                  placeholder="Your name"
                  disabled={isSaving}
                  aria-busy={isSaving}
                  onBlur={async () => {
                    field.onBlur()

                    const valid = await form.trigger("name")
                    if (!valid) return

                    const value = field.value ?? ""
                    if (value === originalNameRef.current) return

                    setIsSaving(true)
                    try {
                      const res = await updateProfileAction({ name: value })
                      if (!res.success) {
                        form.setError("root", {
                          message: res.error || "Failed to update profile. Please try again.",
                        })
                        toast.error(res.error || "Failed to update profile. Please try again.")
                        return
                      }

                      originalNameRef.current = value
                      toast.success("Profile updated successfully")
                      router.refresh()
                    } catch (err) {
                      toAppErrorClient(err, "Unable to save profile changes")
                      form.setError("root", { message: "Unable to save profile changes" })
                      toast.error("Unable to save profile changes")
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                />
              </FormControl>
              <FormMessage />

              {isSaving && <p className="text-xs text-muted-foreground">Saving…</p>}
            </FormItem>
          )}
        />

        {/* No explicit actions: saving happens on blur */}
      </form>
    </Form>
  )
}
