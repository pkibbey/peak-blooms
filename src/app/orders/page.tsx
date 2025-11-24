"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export default function OrdersPage() {
  const router = useRouter()
  const { data: session } = useSession()

  useEffect(() => {
    // Check if user is authenticated
    if (!session) {
      toast.error("Please sign in to view your orders")
      router.push("/auth/signin?callbackUrl=/orders")
      return
    }

    // Check if user is approved
    const user = session.user as unknown as { approved?: boolean }
    if (!user?.approved) {
      toast.error("Your account is pending approval. You'll be able to view orders once approved.")
      router.push("/auth/signin?callbackUrl=/orders")
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
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      <p className="text-muted-foreground">Orders page coming soon...</p>
    </div>
  )
}
