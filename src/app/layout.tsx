import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import "./globals.css";
import Nav from "@/components/site/Nav"
import Footer from "@/components/site/Footer"

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`}>
        <SessionProvider>
          <Nav />

          <main id="content" className="min-h-[calc(100vh-8rem)]">
            {children}
          </main>

          <Footer />
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
