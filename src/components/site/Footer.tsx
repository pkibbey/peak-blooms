import Image from "next/image"
import Link from "next/link"
import { IconInstagram, IconMail, IconPhone } from "@/components/ui/icons"

export default function Footer() {
  return (
    <footer className="bg-background border-t border-t-border">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
          {/* Brand & contact */}
          <div className="flex-1 min-w-[220px]">
            <Link
              prefetch={false}
              href="/"
              className="inline-flex items-center gap-3 text-lg font-semibold mb-3"
            >
              <Image
                src="/logos/peak-blooms-black.png"
                alt="Peak Blooms logo"
                width={880}
                height={202}
                className="h-20 w-auto"
              />
            </Link>

            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Peak Blooms partners with florists, retailers, and event planners to deliver the
              highest quality, freshest flowers at competitive wholesale prices. We're committed to
              exceptional service, sustainable sourcing, and timely delivery.
            </p>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <IconMail aria-hidden="true" />
              <a
                href="mailto:hello@peakblooms.com"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                hello@peakblooms.com
              </a>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <IconPhone aria-hidden="true" />
              <a
                href="tel:6199321139"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                (619) 932-1139
              </a>
            </div>

            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <IconInstagram aria-hidden="true" />
              <a
                href="https://instagram.com/peakblooms"
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                @peakblooms
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 flex-1">
            <div>
              <h4 className="heading-4">Shop</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li>
                  <Link
                    prefetch={false}
                    href="/shop"
                    className="hover:underline inline-flex items-center gap-2"
                  >
                    Flowers
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/collections" className="hover:underline">
                    Collections
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/inspirations" className="hover:underline">
                    Inspirations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="heading-4">Company</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li>
                  <Link
                    prefetch={false}
                    href="/about"
                    className="hover:underline inline-flex items-center gap-2"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/contact" className="hover:underline">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="heading-4">Support</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li>
                  <Link prefetch={false} href="/faq" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/delivery" className="hover:underline">
                    Delivery
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/returns" className="hover:underline">
                    Returns
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="heading-4">Legal</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li>
                  <Link prefetch={false} href="/privacy" className="hover:underline">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/terms" className="hover:underline">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link prefetch={false} href="/cookies" className="hover:underline">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-t-border pt-4 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>© {new Date().getFullYear()} Peak Blooms. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link prefetch={false} href="/site-map" className="hover:underline">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
