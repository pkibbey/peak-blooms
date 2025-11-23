"use client"

import Link from "next/link"
import { IconMail, IconShoppingBag, IconInfo, IconTwitter, IconInstagram, IconFacebook } from "@/components/ui/icons"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-t-border mt-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-8">
          {/* Brand & contact */}
          <div className="flex-1 min-w-[220px]">
            <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold mb-3">
              <span className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 via-rose-400 to-amber-400 shadow" />
              <span>Peak Blooms</span>
            </Link>

            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Peak Blooms — fresh, seasonal bouquets delivered locally. Have questions or need help with an order? Reach out below.
            </p>

            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <IconMail aria-hidden="true" />
              <a href="mailto:hello@peakblooms.example" className="hover:underline">hello@peakblooms.example</a>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <a href="https://twitter.com/" aria-label="Twitter" className="text-muted-foreground hover:text-foreground">
                <IconTwitter />
              </a>
              <a href="https://instagram.com/" aria-label="Instagram" className="text-muted-foreground hover:text-foreground">
                <IconInstagram />
              </a>
              <a href="https://facebook.com/" aria-label="Facebook" className="text-muted-foreground hover:text-foreground">
                <IconFacebook />
              </a>
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 flex-1">
            <div>
              <h4 className="text-sm font-medium">Shop</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li><Link href="/shop" className="hover:underline inline-flex items-center gap-2"><IconShoppingBag />Shop</Link></li>
                <li><Link href="/collections" className="hover:underline">Collections</Link></li>
                <li><Link href="/featured" className="hover:underline">Featured</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium">Company</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li><Link href="/about" className="hover:underline inline-flex items-center gap-2"><IconInfo />About</Link></li>
                <li><Link href="/contact" className="hover:underline">Contact</Link></li>
                <li><Link href="/careers" className="hover:underline">Careers</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium">Support</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li><Link href="/faq" className="hover:underline">FAQ</Link></li>
                <li><Link href="/shipping" className="hover:underline">Shipping</Link></li>
                <li><Link href="/returns" className="hover:underline">Returns</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium">Legal</h4>
              <ul className="mt-3 text-sm text-muted-foreground space-y-2">
                <li><Link href="/privacy" className="hover:underline">Privacy</Link></li>
                <li><Link href="/terms" className="hover:underline">Terms</Link></li>
                <li><Link href="/cookies" className="hover:underline">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-t-border pt-4 text-sm text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>© {new Date().getFullYear()} Peak Blooms. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <Link href="/sitemap" className="hover:underline">Sitemap</Link>
            <Link href="/contact" className="hover:underline">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
