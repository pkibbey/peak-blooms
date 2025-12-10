import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sitemap - Peak Blooms",
  description: "Complete sitemap of Peak Blooms website. Browse all pages and sections.",
}

interface SitemapSection {
  title: string
  links: Array<{
    href: string
    label: string
    description?: string
  }>
}

const sections: SitemapSection[] = [
  {
    title: "Main Pages",
    links: [
      { href: "/", label: "Home", description: "Homepage and featured content" },
      { href: "/shop", label: "Shop", description: "Browse all flowers and products" },
      { href: "/collections", label: "Collections", description: "Curated seasonal collections" },
      {
        href: "/inspirations",
        label: "Inspirations",
        description: "Arrangement ideas and inspiration",
      },
    ],
  },
  {
    title: "Account & Auth",
    links: [
      { href: "/auth/signin", label: "Sign In", description: "Login to your account" },
      { href: "/auth/signup", label: "Sign Up", description: "Create a new account" },
      { href: "/account/profile", label: "Profile", description: "View and manage your profile" },
      {
        href: "/account/addresses",
        label: "Addresses",
        description: "Manage your delivery addresses",
      },
      {
        href: "/account/order-history",
        label: "Order History",
        description: "View your past orders",
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        href: "/about",
        label: "About Us",
        description: "Learn about Peak Blooms mission and values",
      },
      { href: "/contact", label: "Contact", description: "Get in touch with our team" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/faq", label: "FAQ", description: "Frequently asked questions" },
      {
        href: "/shipping",
        label: "Shipping & Delivery",
        description: "Shipping information and delivery details",
      },
      {
        href: "/returns",
        label: "Returns & Refunds",
        description: "Return policy and refund process",
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy", description: "Data privacy and protection" },
      { href: "/terms", label: "Terms of Service", description: "Terms and conditions of use" },
      { href: "/cookies", label: "Cookie Policy", description: "How we use cookies" },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-semibold mb-2">Sitemap</h1>
            <p className="text-lg text-muted-foreground">
              Browse all pages and sections of the Peak Blooms website.
            </p>
          </div>

          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold mb-4 text-[#1F332E]">{section.title}</h2>
                <ul className="space-y-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        prefetch={false}
                        href={link.href}
                        className="text-[#B45F68] hover:underline font-medium"
                      >
                        {link.label}
                      </Link>
                      {link.description && (
                        <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="border-t border-border pt-8">
            <h2 className="text-lg font-semibold mb-3">Need Help?</h2>
            <p className="text-base text-foreground">
              Can't find what you're looking for? Visit our{" "}
              <Link prefetch={false} href="/contact" className="text-[#B45F68] hover:underline">
                Contact page
              </Link>{" "}
              or{" "}
              <Link prefetch={false} href="/faq" className="text-[#B45F68] hover:underline">
                FAQ
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
