"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toAppError } from "@/lib/error-utils"

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
    } catch (_error) {
      toAppError(_error, "Failed to sign in")
      toast.error("Failed to sign in")
    }
  }

  return (
    <Button onClick={handleGoogleSignIn} variant="ghost">
      Sign In
    </Button>
  )
}
