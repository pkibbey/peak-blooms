"use client"

import Link, { LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type NavLinkProps = LinkProps & {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
}

export default function NavLink({ href, children, className, icon, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const active = typeof href === "string" && pathname === href

  return (
    <Button asChild variant="ghost" className={cn(active ? "bg-accent text-accent-foreground" : "hover:bg-accent/50", className)}>
      <Link href={href} aria-current={active ? "page" : undefined} {...props}>
        {icon ? (
          <span className="inline-flex items-center" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        {children}
      </Link>
    </Button>
  )
}
