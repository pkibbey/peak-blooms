import { redirect } from "next/navigation"
import { getCartAction } from "@/app/actions/cart"
import CheckoutForm from "@/components/site/CheckoutForm"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/lib/db"

export default async function CheckoutPage() {
  const user = await getCurrentUser()

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect("/auth/signin?callbackUrl=/checkout")
  }

  // Redirect to pending approval if not approved
  if (!user.approved) {
    redirect("/pending-approval")
  }

  // Fetch cart data (don't create - redirect if doesn't exist)
  const cartResult = await getCartAction()

  // Redirect to cart if empty or error
  if (
    !cartResult ||
    !cartResult.success ||
    !cartResult.data ||
    cartResult.data.items.length === 0
  ) {
    redirect("/cart")
  }

  const cart = cartResult.data

  // Fetch user's saved addresses, with default first
  const savedAddresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="heading-1 mb-8">Checkout</h1>
      <CheckoutForm cart={cart} savedAddresses={savedAddresses} />
    </div>
  )
}
