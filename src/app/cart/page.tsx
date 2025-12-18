import { redirect } from "next/navigation"
import Cart from "@/components/site/Cart"
import { DeliveryBanner } from "@/components/site/DeliveryBanner"
import EmptyState from "@/components/site/EmptyState"
import { getCurrentUser } from "@/lib/current-user"
import { getCartAction } from "../actions/cart"

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
  const cart = await getCartAction()

  if (!cart) {
    return (
      <>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="heading-1 mb-8">Shopping Cart</h1>
          <EmptyState />
        </div>
        <DeliveryBanner />
      </>
    )
  }

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="heading-1 mb-8">Shopping Cart</h1>
        <Cart initialCart={cart} />
      </div>
      <DeliveryBanner />
    </>
  )
}
