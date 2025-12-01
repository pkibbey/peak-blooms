"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
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
import { authClient } from "@/lib/auth-client"
import { type SignInFormData, signInSchema } from "@/lib/validations/auth"

export default function SignInPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  // If a caller passed a callbackUrl (e.g. /admin) keep it; otherwise send
  // users through a short server-side redirect handler which will route
  // admins to /admin and everyone else to home. This ensures admin users
  // who sign in from the generic flow are taken to the dashboard.
  const callbackUrl =
    searchParams.get("callbackUrl") || `/auth/redirect?next=${encodeURIComponent("/")}`
  const error = searchParams.get("error")

  const [submitted, setSubmitted] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState("")

  const form = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: SignInFormData) => {
    try {
      console.log("[SignIn] Submitting magic link request for email:", data.email)
      console.log("[SignIn] Callback URL:", callbackUrl)

      const response = await authClient.signIn.magicLink({
        email: data.email,
        callbackURL: callbackUrl,
      })

      console.log("[SignIn] Magic link response:", response)
      setSubmittedEmail(data.email)
      setSubmitted(true)
    } catch (error) {
      console.error("[SignIn] Error during magic link submission:", error)
      form.setError("root", { message: "Failed to send sign-in email. Please try again." })
      console.error("Error signing in:", error)
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Check your email</h1>
            <p className="text-sm text-muted-foreground">
              We&apos;ve sent a sign-in link to <strong>{submittedEmail}</strong>
            </p>
          </div>
          <div className="space-y-4 text-center text-sm text-muted-foreground">
            <p>Click the link in the email to sign in to your account.</p>
            <p>The link expires in 24 hours.</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return to home</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in to Peak Blooms</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in or create an account
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error === "Callback" && "Invalid sign-in link or link has expired."}
            {error === "EmailSignInError" && "Failed to send sign-in email."}
            {error && !["Callback", "EmailSignInError"].includes(error) && error}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {form.formState.errors.root && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {form.formState.errors.root.message}
              </div>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
              {form.formState.isSubmitting ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}
