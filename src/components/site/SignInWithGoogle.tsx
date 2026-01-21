"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

type Props = {
  onDone?: () => void
}

export default function SignInWithGoogle({ onDone }: Props) {
  const handleGoogleSignIn = async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
      })
      onDone?.()
    } catch (error) {
      toast.error("Failed to sign in")
      console.error("[SignIn] Error during Google sign-in:", error)
    }
  }

  return (
    <Button onClick={handleGoogleSignIn} variant="ghost">
      Sign In
    </Button>
  )
}
