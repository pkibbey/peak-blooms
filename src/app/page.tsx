import { Button } from "@/components/ui/button";
import { IconShoppingBag, IconInfo } from "@/components/ui/icons"
import Link from "next/link";
import Hero from "@/components/site/Hero";
import FeaturedCategories from "@/components/site/FeaturedCategories";

export default function Home() {
  return (
    <>
      <Hero 
        title="The art of Bloom"
        subtitle="Sourced for the discerning florist."
        cta={
          <Button asChild>
            <Link href="/shop" className="inline-flex items-center gap-1">
              Explore collections
            </Link>
          </Button>
        }
      />
      <FeaturedCategories />
      <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-50 font-sans py-16">
        <div className="w-full max-w-5xl px-6">
          <section className="rounded-xl bg-white/80 p-8 shadow-lg">
            <h1 className="text-3xl font-extrabold">Welcome to Peak Blooms</h1>
            <p className="mt-2 text-muted-foreground">Handpicked flowers and seasonal bouquets — delivered with care.</p>

            <div className="mt-6 flex gap-3">
              <Button asChild>
                <Link href="/shop" className="inline-flex items-center gap-1">
                  <IconShoppingBag aria-hidden="true" />
                  Shop bouquets
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/about" className="inline-flex items-center gap-1">
                  <IconInfo aria-hidden="true" />
                  Learn more
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
