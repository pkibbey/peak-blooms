import Link, { type LinkProps } from "next/link"

interface BackLinkProps extends Omit<LinkProps, "href"> {
  href: string
  label: string
  className?: string
}

export default function BackLink({ href, label, className, ...props }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`text-sm text-primary inline-block mb-4 ${className || ""}`.trim()}
      {...props}
    >
      ← Back to {label}
    </Link>
  )
}
