"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { signOut } from "next-auth/react"
import NavLink from "@/components/site/NavLink"
import {
  IconHome,
  IconShoppingBag,
  IconMenu,
  IconX,
  IconShoppingCart,
  IconRose,
  IconFlower,
  IconSettings,
} from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

const links = [
  { label: "Home", href: "/", icon: <IconHome /> },
  { label: "Shop", href: "/shop", icon: <IconShoppingBag /> },
  { label: "Collections", href: "/collections", icon: <IconFlower /> },
  { label: "Inspiration", href: "/inspiration", icon: <IconRose /> },
]

interface NavProps {
  user: {
    role: "CUSTOMER" | "ADMIN";
    approved: boolean;
    email: string | null;
    name?: string | null;
  } | null;
}

export default function Nav({ user }: NavProps) {
  const [open, setOpen] = useState(false)
  const isApproved = user?.approved === true

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-sm border-b border-b-border">
      <a href="#content" className="sr-only focus:not-sr-only focus:sr-only:block px-4 py-2">
        Skip to content
      </a>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold">
              <Image 
                src="/logos/peakblooms.png"
                alt="Peak Blooms logo"
                width={384}
                height={44}
                loading="eager"
                className="h-8 w-[139px]"
              />
            </Link>

            <nav className="hidden md:flex md:items-center md:gap-1 md:ml-2" aria-label="Primary">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href} icon={l.icon}>
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isApproved && (
              <div className="hidden md:block">
                <Link href="/cart" className="inline-flex items-center gap-1">
                  <IconShoppingCart aria-hidden="true" />
                  <span>Cart</span>
                </Link>
              </div>
            )}

            {user?.role === "ADMIN" && (
              <div className="hidden md:block">
                <Link href="/admin" className="inline-flex items-center gap-1">
                  <IconSettings aria-hidden="true" />
                  <span>Admin</span>
                </Link>
              </div>
            )}

            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden md:inline-flex"
              >
                Sign Out
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="outline" className="hidden md:inline-flex">
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button asChild size="sm" className="hidden md:inline-flex">
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </div>
            )}

            <Button
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden",
                open ? "bg-secondary/30" : "hover:bg-secondary/10"
              )}
              variant="default"
            >
              {open ? <IconX aria-hidden="true" /> : <IconMenu aria-hidden="true" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden mt-2 pb-4 border-t border-t-border">
            <div className="flex flex-col gap-1 py-2">
              {links.map((l) => (
                <NavLink key={l.href} href={l.href} icon={l.icon} className="px-4 py-2">
                  {l.label}
                </NavLink>
              ))}
              {isApproved && (
                <Button asChild variant="ghost">
                  <Link href="/cart" className="inline-flex items-center gap-1 px-4 py-2">
                    <IconShoppingCart aria-hidden="true" />
                    <span>Cart</span>
                  </Link>
                </Button>
              )}
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Button asChild variant="ghost">
                      <Link href="/admin" className="px-4 py-2">
                        <IconSettings aria-hidden="true" />
                        Admin Dashboard
                      </Link>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="text-destructive"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="ghost">
                    <Link href="/auth/signin" className="px-4 py-2">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/auth/signup" className="px-4 py-2">
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
