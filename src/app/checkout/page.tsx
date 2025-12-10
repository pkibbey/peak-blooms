import Link from "next/link"
import { redirect } from "next/navigation"
import CheckoutForm from "@/components/site/CheckoutForm"
import { Button } from "@/components/ui/button"
import { IconShoppingBag } from "@/components/ui/icons"
import { calculateCartTotal, getCurrentUser, getOrCreateCart } from "@/lib/current-user"
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

  // Fetch cart data
  const cart = await getOrCreateCart(user)

  // Redirect to cart if empty
  if (!cart || cart.items.length === 0) {
    redirect("/cart")
  }

  const total = calculateCartTotal(cart.items)

  // Fetch user's saved addresses, with default first
  const savedAddresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  })

  // If cart is somehow null at this point (shouldn't happen)
  if (!cart) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <IconShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="heading-2 mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some items to your cart before checking out.
          </p>
          <Button asChild>
            <Link prefetch={false} href="/shop">
              Browse Products
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="heading-1 mb-8">Checkout</h1>
      <CheckoutForm
        cart={{ ...cart, total }}
        savedAddresses={savedAddresses}
        userEmail={user.email || ""}
      />
    </div>
  )
}
