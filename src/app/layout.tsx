import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";
import Nav from "@/components/site/Nav"
import Footer from "@/components/site/Footer"
import { getCurrentUser, getOrCreateCart } from "@/lib/auth-utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peak Blooms - Premium Wholesale Flowers",
  description: "Source premium wholesale flowers for your florist business. Curated selections, inspirational arrangements, and reliable B2B service for florist businesses.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await getCurrentUser();
  const user = currentUser ? {
    role: currentUser.role,
    approved: currentUser.approved,
    email: currentUser.email,
    name: currentUser.name,
  } : null;

  // Fetch cart count for approved users
  let cartCount = 0;
  if (currentUser?.approved) {
    const cart = await getOrCreateCart();
    if (cart?.items) {
      cartCount = cart.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
    }
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}>
        <SessionProvider>
          <Nav user={user} cartCount={cartCount} />

          <main id="content">
            {children}
          </main>

          <Footer />
          <Toaster position="bottom-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
