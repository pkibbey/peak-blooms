"use client"

import type { VariantProps } from "class-variance-authority"
import Link, { type LinkProps } from "next/link"
import { usePathname } from "next/navigation"
import { Button, type buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type NavLinkProps = LinkProps &
  VariantProps<typeof buttonVariants> & {
    children: React.ReactNode
    className?: string
    icon?: React.ReactNode
  }

export default function NavLink({
  variant = "ghost",
  href,
  children,
  className,
  icon,
  size,
  ...props
}: NavLinkProps) {
  const pathname = usePathname()
  const active = typeof href === "string" && pathname === href
  const nonActiveHover =
    variant === "default" ? "hover:bg-primary/50" : "hover:bg-secondary/50 hover:text-foreground"

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(active ? "bg-secondary text-secondary-foreground" : nonActiveHover, className)}
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
