import Image from "next/image"
import Link from "next/link"
import { getCartAction } from "@/app/actions/cart"
import NavLink from "@/components/site/NavLink"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// import UserMenu from "@/components/site/UserMenu"
import { IconSearch, IconShoppingCart } from "@/components/ui/icons"
import { getCurrentUser } from "@/lib/current-user"
import MobileNav from "./MobileNav"
import NavSearch from "./NavSearch"
import UserMenu from "./UserMenu"

const links = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Inspirations", href: "/inspirations" },
]

export default async function Nav() {
  const user = await getCurrentUser()
  const isApproved = user?.approved === true

  // Fetch cart count for approved users (sum of item quantities, not unique item count)
  // Only get the cart if it exists - don't create one just for displaying the count
  let cartCount = 0
  if (isApproved) {
    const cartResult = await getCartAction()
    if (cartResult?.success && cartResult.data?.items) {
      cartCount = cartResult.data.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-sm border-b border-b-border">
      <a href="#content" className="sr-only focus:not-sr-only focus:sr-only:block px-4 py-2">
        Skip to content
      </a>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center gap-6">
          <div className="flex items-center gap-4">
            <Link
              prefetch={false}
              href="/"
              className="inline-flex items-center gap-3 text-lg font-semibold"
            >
              <Image
                src="/logos/peak-blooms-black.png"
                alt="Peak Blooms logo"
                width={880}
                height={202}
                loading="eager"
                className="h-8 w-auto shrink-0"
              />
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-2" aria-label="Primary">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href}>
                  {l.label}
                </NavLink>
              ))}

              {/* Admin link used to appear inline here; now handled inside the user menu */}
            </nav>
          </div>

          {/* Nav search autocomplete */}
          <div className="flex-1">
            <NavSearch />
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile search button */}
            <Button size="icon" variant="ghost" className="md:hidden" aria-label="Search products">
              <IconSearch aria-hidden="true" />
            </Button>

            {isApproved && (
              <div className="hidden md:block">
                <Link prefetch={false} href="/cart" className="inline-flex items-center gap-2">
                  <IconShoppingCart aria-hidden="true" />
                  <span>Cart</span>
                  {cartCount > 0 && <Badge variant="default">{cartCount}</Badge>}
                </Link>
              </div>
            )}

            {/* Consolidated user/account/admin menu */}
            <UserMenu user={user} />

            <MobileNav user={user} isApproved={isApproved} links={links} cartCount={cartCount} />
          </div>
        </div>

        {/* Mobile menu handled by MobileNav */}
        <div id="mobile-nav-root" className="md:hidden" />
      </div>
    </header>
  )
}
