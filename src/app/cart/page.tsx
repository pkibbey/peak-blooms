"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export default function CartPage() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    // Check if user is authenticated
    if (!session) {
      toast.error("Please sign in to view your cart")
      router.push("/auth/signin?callbackUrl=/cart")
      return
    }

    // Check if user is approved
    const user = session.user as unknown as { approved?: boolean }
    if (!user?.approved) {
      toast.error("Your account is pending approval. You'll be able to shop once approved.")
      router.push("/auth/signin?callbackUrl=/cart")
      return
    }
  }, [session, router])

  // If not approved or not authenticated, show loading state while redirecting
  if (!session || !(session.user as unknown as { approved?: boolean })?.approved) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <p className="text-muted-foreground">Cart page coming soon...</p>
    </div>
  )
}
