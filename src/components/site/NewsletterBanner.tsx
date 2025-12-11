"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useSession } from "@/lib/auth-client"
import {
  type NewsletterSubscribeFormData,
  newsletterSubscribeSchema,
} from "@/lib/validations/newsletter"
import { IconX } from "../ui/icons"

export function NewsletterBanner() {
  const { data: session, isPending } = useSession()
  const [isDismissed, setIsDismissed] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<NewsletterSubscribeFormData>({
    resolver: zodResolver(newsletterSubscribeSchema),
    defaultValues: {
      email: "",
    },
  })

  // Only show banner if user is not authenticated and hasn't dismissed it
  useEffect(() => {
    if (!isPending && !session) {
      const dismissed = localStorage.getItem("newsletter-banner-dismissed")
      setIsDismissed(!!dismissed)
    } else {
      // Hide banner for authenticated users
      setIsDismissed(true)
    }
  }, [session, isPending])

  const handleDismiss = () => {
    localStorage.setItem("newsletter-banner-dismissed", "true")
    setIsDismissed(true)
  }

  const onSubmit = async (data: NewsletterSubscribeFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        form.reset()
        toast.success("Thanks for signing up for our newsletter!")

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
          handleDismiss()
        }, 3000)
      } else {
        toast.error("Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Newsletter subscribe error:", error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render if dismissed or user is authenticated
  if (isDismissed || session) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <h3 className="text-sm font-semibold">Weekly Specials</h3>
            <p className="text-sm text-muted-foreground">
              Subscribe to our newsletter for exclusive weekly specials and flower arrangements.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex w-full gap-2 sm:w-auto items-center"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email"
                        disabled={isSubmitting}
                        className="min-w-[250px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmitting} size="lg" variant="secondary">
                {isSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </form>
          </Form>

          <button
            type="button"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss newsletter banner"
          >
            <IconX className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}
