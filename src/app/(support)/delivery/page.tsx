import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delivery - Peak Blooms",
  description:
    "Learn about Peak Blooms delivery options, delivery areas, timing, and how we ensure your flowers arrive fresh.",
}

export default function DeliveryPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-semibold font-serif mb-2">Delivery</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about getting your flowers delivered fresh.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">Free Regional Delivery</h2>
        <p className="text-base text-foreground leading-relaxed">
          Peak Blooms offers <span className="font-semibold text-green-600">free delivery</span> to
          our regional delivery area. We've built our logistics around local delivery to ensure
          freshness, reliability, and affordability. We deliver using our own team of delivery
          drivers—not third-party carriers—so we maintain full control over how your flowers are
          handled and delivered, usually within 24-48 hours of your order depending on timing and
          availability. If you're unsure whether your location is covered, contact us to confirm.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">How It Works</h2>
        <ol className="space-y-2 text-base text-foreground list-decimal list-inside">
          <li className="leading-relaxed">
            <span className="font-semibold">Place Your Order</span> - Select flowers and
            arrangements through Peak Blooms. Orders placed before 2pm are typically processed
            same-day.
          </li>
          <li className="leading-relaxed">
            <span className="font-semibold">Prepare & Pack</span> - We source and prepare your
            flowers with care, using specialty packaging to protect them during transit.
          </li>
          <li className="leading-relaxed">
            <span className="font-semibold">Deliver</span> - Your order is delivered by our delivery
            team. You'll receive a delivery window for your area.
          </li>
          <li className="leading-relaxed">
            <span className="font-semibold">Receive & Store</span> - Keep flowers cool and away from
            direct sunlight. Follow care instructions for maximum longevity.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">Freshness Guarantee</h2>
        <p className="text-base text-foreground leading-relaxed">
          We take pride in the quality of every delivery. Flowers are cut within 24-48 hours of
          delivery and packed with care. If flowers arrive damaged or below our quality standards,
          contact us within 24 hours with photos, and we'll work to make it right.
        </p>
        <ul className="space-y-2 text-base text-foreground list-disc list-inside">
          <li>Most flowers arrive at peak bloom stage</li>
          <li>Specialty packaging protects stems and petals</li>
          <li>Quick transit times maintain freshness</li>
          <li>Delivery windows allow you to receive flowers at the right time</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">Care Instructions</h2>
        <p className="text-base text-foreground leading-relaxed">
          When flowers arrive, follow these tips to maximize their lifespan:
        </p>
        <ol className="space-y-2 text-base text-foreground list-decimal list-inside">
          <li className="grid md:grid-cols-[70px_auto] gap-3">
            <span className="font-semibold text-[#1F332E]">Unwrap</span>
            <span>
              Remove packaging and allow flowers to acclimate to room temperature for 30 minutes.
            </span>
          </li>
          <li className="grid md:grid-cols-[70px_auto] gap-3">
            <span className="font-semibold text-[#1F332E]">Trim</span>
            <span>Cut 1-2 inches off the bottom of each stem at a 45-degree angle.</span>
          </li>
          <li className="grid md:grid-cols-[70px_auto] gap-3">
            <span className="font-semibold text-[#1F332E]">Hydrate</span>
            <span>
              Place in a clean vase filled with cool water and flower food (included with orders).
            </span>
          </li>
          <li className="grid md:grid-cols-[70px_auto] gap-3">
            <span className="font-semibold text-[#1F332E]">Position</span>
            <span>Keep away from direct sunlight, heat sources, and ripening fruit.</span>
          </li>
          <li className="grid md:grid-cols-[70px_auto] gap-3">
            <span className="font-semibold text-[#1F332E]">Refresh</span>
            <span>Change water every 2-3 days and re-trim stems as needed.</span>
          </li>
        </ol>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold font-serif">Questions About Delivery?</h2>
        <p className="text-base text-foreground">
          Reach out to our team at{" "}
          <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
            hello@peakblooms.com
          </a>{" "}
          or{" "}
          <a href="tel:6199321139" className="text-[#B45F68] hover:underline">
            (619) 932-1139
          </a>
          . We're happy to discuss your specific needs or timeline.
        </p>
      </section>
    </div>
  )
}
