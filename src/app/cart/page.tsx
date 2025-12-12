import { redirect } from "next/navigation"
import Cart from "@/components/site/Cart"
import EmptyState from "@/components/site/EmptyState"
import { DeliveryBanner } from "@/components/site/DeliveryBanner"
import { calculateCartTotal, getCurrentUser, getOrCreateCart } from "@/lib/current-user"

export default async function CartPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/signin?callbackUrl=/cart")
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/pending-approval")
  }

  // Fetch cart data server-side
  const cart = await getOrCreateCart(user)

  const total = cart ? calculateCartTotal(cart.items) : 0

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="heading-1 mb-8">Shopping Cart</h1>
        {cart ? <Cart initialCart={{ id: cart.id, items: cart.items, total }} /> : <EmptyState />}
      </div>
      <DeliveryBanner />
    </>
  )
}
