import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display, Raleway } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import Footer from "@/components/site/Footer"
import Nav from "@/components/site/Nav"
import { NewsletterBanner } from "@/components/site/NewsletterBanner"
import { getCurrentUser, getOrCreateCart } from "@/lib/current-user"

const raleway = Raleway({ subsets: ["latin"], variable: "--font-sans" })

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Peak Blooms - Premium Wholesale Flowers",
  description:
    "Source premium wholesale flowers for your florist business. Curated selections, inspirational arrangements, and reliable B2B service for florist businesses.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const user = await getCurrentUser()

  // Fetch cart count for approved users (count of unique items, not total quantity)
  let cartCount = 0
  if (user?.approved) {
    const cart = await getOrCreateCart(user)
    if (cart?.items) {
      cartCount = cart.items.length
    }
  }

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} ${raleway.variable} antialiased`}
      >
        {/* <Nav user={user} cartCount={cartCount} /> */}

        <main id="content">{children}</main>

        <NewsletterBanner />
        <Footer />
        <Toaster position="bottom-center" richColors />
      </body>
    </html>
  )
}
