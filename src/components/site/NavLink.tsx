"use client"

import Link, { LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

type NavLinkProps = LinkProps & {
  children: React.ReactNode
  className?: string
}

export default function NavLink({ href, children, className, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const active = typeof href === "string" && pathname === href

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-block px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
