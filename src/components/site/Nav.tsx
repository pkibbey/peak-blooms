"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import NavLink from "@/components/site/NavLink"
import {
  IconHome,
  IconShoppingBag,
  IconMenu,
  IconX,
  IconShoppingCart,
  IconRose,
  IconFlower,
} from "@/components/ui/icons"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

const links = [
  { label: "Home", href: "/", icon: <IconHome /> },
  { label: "Shop", href: "/shop", icon: <IconShoppingBag /> },
  { label: "Collections", href: "/collections", icon: <IconFlower /> },
  { label: "Inspiration", href: "/inspiration", icon: <IconRose /> },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

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
                className="h-8 w-auto"
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
            <div className="hidden md:block">
              <Link href="/cart" className="inline-flex items-center gap-1">
                <IconShoppingCart aria-hidden="true" />
                <span>Cart</span>
              </Link>
            </div>

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
              <Button asChild variant="ghost">
                <Link href="/cart" className="inline-flex items-center gap-1 px-4 py-2">
                  <IconShoppingCart aria-hidden="true" />
                  <span>Cart</span>
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
