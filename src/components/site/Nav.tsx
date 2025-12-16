import Image from "next/image"
import Link from "next/link"
import NavLink from "@/components/site/NavLink"
import SignOutButton from "@/components/site/SignOutButton"
// import UserMenu from "@/components/site/UserMenu"
import {
  IconMenu,
  IconSearch,
  IconSettings,
  IconShoppingCart,
  IconUser,
} from "@/components/ui/icons"
import { getCurrentUser, getOrCreateCart } from "@/lib/current-user"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import NavSearch from "./NavSearch"
import SignInWithGoogle from "./SignInWithGoogle"
import UserMenu from "./UserMenu"

const links = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Inspirations", href: "/inspirations" },
]

export default async function Nav() {
  const user = await getCurrentUser()
  const isApproved = user?.approved === true

  // Fetch cart count for approved users (count of unique items, not total quantity)
  let cartCount = 0
  if (isApproved) {
    const cart = await getOrCreateCart(user)
    if (cart?.items) {
      cartCount = cart.items.length
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
                src="/logos/peakblooms.png"
                alt="Peak Blooms logo"
                width={384}
                height={44}
                loading="eager"
                className="h-8 w-34.75 shrink-0"
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

            <Button size="icon" className="md:hidden" variant="default">
              {<IconMenu aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}

        <div className="md:hidden mt-2 pb-4 border-t border-t-border">
          <div className="flex flex-col gap-1 py-2">
            {links.map((l) => (
              <NavLink key={l.href} href={l.href} className="px-4 py-2">
                {l.label}
              </NavLink>
            ))}
            {isApproved && (
              <Button
                variant="ghost"
                nativeButton={false}
                render={
                  <Link
                    prefetch={false}
                    href="/cart"
                    className="inline-flex items-center gap-2 px-4 py-2"
                  >
                    <IconShoppingCart aria-hidden="true" />
                    <span>Cart</span>
                    {cartCount > 0 && <Badge variant="default">{cartCount}</Badge>}
                  </Link>
                }
              />
            )}
            {user ? (
              <>
                <NavLink href="/account" icon={<IconUser />} className="px-4 py-2">
                  Account
                </NavLink>
                {user.role === "ADMIN" && (
                  <NavLink href="/admin" icon={<IconSettings />} className="px-4 py-2">
                    Admin Dashboard
                  </NavLink>
                )}
                <SignOutButton />
              </>
            ) : (
              <>
                <SignInWithGoogle />
                <NavLink href="/auth/signup" className="px-4 py-2">
                  Sign Up
                </NavLink>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
