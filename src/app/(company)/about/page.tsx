import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Peak Blooms",
  description: "Learn about Peak Blooms — our mission, values, and commitment to premium wholesale flowers.",
}

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">About Peak Blooms</h1>
        <p className="text-lg text-muted-foreground">
          Sourcing premium wholesale flowers for independent florist businesses
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Mission</h2>
        <p className="text-base text-foreground leading-relaxed">
          Peak Blooms exists to empower independent florists with access to the highest-quality, freshest seasonal flowers at competitive wholesale prices. We believe that small, independent floral businesses deserve the same premium sourcing and service as larger enterprises—without the complexity or hidden fees.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Values</h2>
        <ul className="space-y-3 text-base text-foreground">
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Transparency</span>
            <span>We believe in clear pricing, honest product descriptions, and straightforward communication every step of the way.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Quality</span>
            <span>Every bouquet, stem, and arrangement meets our high standards for freshness, beauty, and longevity.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Partnership</span>
            <span>We're not just a supplier—we're a partner invested in your success and growth.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Seasonality</span>
            <span>We celebrate what's fresh and in-season, supporting local growers and sustainable practices.</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Experience</h2>
        <p className="text-base text-foreground leading-relaxed">
          With years of experience in wholesale floral sourcing, Peak Blooms understands the unique challenges facing independent florists. From managing seasonal availability to minimizing waste while maintaining selection, we've built systems that work.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          Our network of trusted growers, local suppliers, and specialty importers ensures that we can offer a diverse selection of premium flowers year-round, with a focus on seasonal arrangements that inspire creativity and drive sales.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Why Choose Peak Blooms</h2>
        <ul className="space-y-2 text-base text-foreground list-disc list-inside">
          <li>Curated selections of seasonal and specialty flowers</li>
          <li>Competitive wholesale pricing without hidden fees</li>
          <li>Reliable local delivery and fast turnaround times</li>
          <li>Inspirational content and arrangement ideas to support your business</li>
          <li>Dedicated support from real people who understand floristry</li>
          <li>Easy-to-use platform designed specifically for florist workflows</li>
        </ul>
      </section>
    </div>
  )
}
