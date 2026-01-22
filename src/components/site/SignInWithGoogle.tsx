"use client"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"
import { toAppErrorClient } from "@/lib/error-utils"

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
      toAppErrorClient(_error, "Failed to sign in")
    }
  }

  return (
    <Button onClick={handleGoogleSignIn} variant="ghost">
      Sign In
    </Button>
  )
}
