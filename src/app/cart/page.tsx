import { redirect } from "next/navigation"
import Cart from "@/components/site/Cart"
import EmptyState from "@/components/site/EmptyState"
import { calculateCartTotal, getCurrentUser, getOrCreateCart } from "@/lib/current-user"

export default async function CartPage() {
  const user = await getCurrentUser()

  // If not authenticated, render a viewable (empty) cart so guests can
  // inspect the UI. Cart interactions still require signing in to modify.
  if (!user) {
    const total = 0

    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="heading-1 mb-8">Shopping Cart</h1>
        <Cart initialCart={{ id: "", items: [], total }} />
      </div>
    )
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/auth/pending-approval")
  }

  // Fetch cart data server-side
  const cart = await getOrCreateCart(user)

  const total = cart ? calculateCartTotal(cart.items) : 0

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="heading-1 mb-8">Shopping Cart</h1>
      {cart ? <Cart initialCart={{ id: cart.id, items: cart.items, total }} /> : <EmptyState />}
    </div>
  )
}
