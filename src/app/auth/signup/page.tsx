"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { useEffect } from "react"
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
import { type SignUpFormData, signUpSchema } from "@/lib/validations/auth"

export default function SignUpPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const form = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
    },
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/")
    }
  }, [status, session, router])

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signIn("email", {
        email: data.email,
        redirect: false,
      })

      if (result?.ok) {
        // Redirect to pending approval page
        router.push(`/auth/pending-approval?email=${encodeURIComponent(data.email)}`)
      } else {
        form.setError("root", { message: "Failed to send sign-up email. Please try again." })
        console.error("Sign up failed:", result?.error)
      }
    } catch (error) {
      form.setError("root", { message: "An error occurred. Please try again." })
      console.error("Error signing up:", error)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">
            Sign up to explore Peak Blooms and get exclusive first-time customer discounts
          </p>
        </div>

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
              {form.formState.isSubmitting ? "Signing up..." : "Sign Up with Email"}
            </Button>
          </form>
        </Form>

        <div className="space-y-3 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By signing up, you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}
