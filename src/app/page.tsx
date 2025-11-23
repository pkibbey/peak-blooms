import { IconShoppingBag, IconInfo } from "@/components/ui/icons"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-50 font-sans py-16">
      <div className="w-full max-w-5xl px-6">
        <section className="rounded-xl bg-white/80 p-8 shadow-sm border">
          <h1 className="text-3xl font-extrabold">Welcome to Peak Blooms</h1>
          <p className="mt-2 text-muted-foreground">Handpicked flowers and seasonal bouquets — delivered with care.</p>

          <div className="mt-6 flex gap-3">
            <a href="/shop" className="inline-block rounded-md bg-primary px-4 py-2 text-white inline-flex items-center">
              <IconShoppingBag aria-hidden="true" className="mr-2" />
              Shop bouquets
            </a>
            <a href="/about" className="inline-block rounded-md border px-4 py-2 inline-flex items-center gap-2">
              <IconInfo aria-hidden="true" />
              Learn more
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
