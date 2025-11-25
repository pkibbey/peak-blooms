import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth-utils"
import Cart from "@/components/site/Cart"

export default async function CartPage() {
  const user = await getCurrentUser()

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect("/auth/signin?callbackUrl=/cart")
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/auth/pending-approval")
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold font-serif mb-8">Shopping Cart</h1>
      <Cart />
    </div>
  )
}
