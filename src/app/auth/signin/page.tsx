"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export default function SignInPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const handleGoogleSignIn = async () => {
    try {
      console.log("[SignIn] Starting Google OAuth sign-in")
      await authClient.signIn.social({
        provider: "google",
      })
    } catch (error) {
      console.error("[SignIn] Error during Google sign-in:", error)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Sign in to Peak Blooms</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to get started
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {error === "Callback" && "Sign-in failed. Please try again."}
            {error && !["Callback"].includes(error) && error}
          </div>
        )}

        <Button onClick={handleGoogleSignIn} className="w-full">
          Sign in with Google
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By signing in, you agree to our terms of service.
        </p>

        <div className="border-t border-border pt-4">
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
