"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { authClient, useSession } from "@/lib/auth-client"

export default function SignUpPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  // Redirect if already authenticated
  useEffect(() => {
    if (!isPending && session) {
      router.push("/")
    }
  }, [isPending, session, router])

  const handleGoogleSignUp = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      })
    } catch (error) {
      console.error("[SignUp] Error during Google sign-up:", error)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Create Your Account</h1>
          <p className="text-sm text-muted-foreground">
            Sign up with your Google account to get started with Peak Blooms
          </p>
        </div>

        <Button onClick={handleGoogleSignUp} className="w-full">
          Sign up with Google
        </Button>

        <div className="space-y-3 text-center text-sm">
          <p className="text-muted-foreground">
            Already have an account?{" "}
            <Link prefetch={false} href="/auth/signin" className="font-medium hover:underline">
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
