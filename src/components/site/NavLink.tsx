"use client"

import Link, { type LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavLinkProps = LinkProps & {
  children: React.ReactNode
  className?: string
  icon?: React.ReactNode
  variant?: "outline" | "ghost" | "default"
}

export default function NavLink({
  variant = "ghost",
  href,
  children,
  className,
  icon,
  ...props
}: NavLinkProps) {
  const pathname = usePathname()
  const active = typeof href === "string" && pathname === href

  return (
    <Button
      variant={variant}
      className={cn(
        active
          ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground"
          : "hover:bg-secondary/50 hover:text-foreground",
        className
      )}
      nativeButton={false}
      render={
        <Link prefetch={false} href={href} aria-current={active ? "page" : undefined} {...props}>
          {icon ? (
            <span className="inline-flex items-center" aria-hidden="true">
              {icon}
            </span>
          ) : null}

          {children}
        </Link>
      }
    ></Button>
  )
}
