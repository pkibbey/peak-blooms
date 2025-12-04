import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shipping - Peak Blooms",
  description:
    "Learn about Peak Blooms shipping options, delivery areas, timing, and how we ensure your flowers arrive fresh.",
}

export default function ShippingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Shipping & Delivery</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about getting your flowers delivered fresh.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Delivery Areas</h2>
        <p className="text-base text-foreground leading-relaxed">
          Peak Blooms currently delivers to the greater San Diego area and surrounding regions.
          We've built our logistics around local delivery to ensure freshness and reliability. If
          you're unsure whether your location is covered, contact us to confirm.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          We partner with local delivery services to get flowers to you as quickly as
          possible—usually within 24-48 hours of your order, depending on timing and availability.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How It Works</h2>
        <ol className="space-y-3 text-base text-foreground list-decimal list-inside">
          <li className="leading-relaxed">
            <span className="font-semibold">Place Your Order</span> — Select flowers and
            arrangements through Peak Blooms. Orders placed before 2pm are typically processed
            same-day.
          </li>
          <li className="leading-relaxed">
            <span className="font-semibold">Prepare & Pack</span> — We source and prepare your
            flowers with care, using specialty packaging to protect them during transit.
          </li>
          <li className="leading-relaxed">
            <span className="font-semibold">Deliver</span> — Your order ships via our delivery
            partner. You'll receive a delivery window for your area.
          </li>
          <li className="leading-relaxed">
            <span className="font-semibold">Receive & Store</span> — Keep flowers cool and away from
            direct sunlight. Follow care instructions for maximum longevity.
          </li>
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Shipping & Delivery Rates</h2>
        <p className="text-base text-foreground leading-relaxed">
          Shipping rates vary based on order size, delivery location, and any special handling.
          Rates are calculated at checkout and shown before you confirm your order. We aim to keep
          delivery costs reasonable while ensuring professional, timely service.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          Large orders or regular recurring deliveries may qualify for discounted or flat-rate
          shipping. Contact our team to discuss volume pricing.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Freshness Guarantee</h2>
        <p className="text-base text-foreground leading-relaxed">
          We take pride in the quality of every shipment. Flowers are cut within 24-48 hours of
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
        <h2 className="text-2xl font-semibold">Care Instructions</h2>
        <p className="text-base text-foreground leading-relaxed">
          When flowers arrive, follow these tips to maximize their lifespan:
        </p>
        <ul className="space-y-2 text-base text-foreground">
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Unwrap</span>
            <span>
              Remove packaging and allow flowers to acclimate to room temperature for 30 minutes.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Trim</span>
            <span>Cut 1-2 inches off the bottom of each stem at a 45-degree angle.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Hydrate</span>
            <span>
              Place in a clean vase filled with cool water and flower food (included with orders).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Position</span>
            <span>Keep away from direct sunlight, heat sources, and ripening fruit.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Refresh</span>
            <span>Change water every 2-3 days and re-trim stems as needed.</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold">Questions About Delivery?</h2>
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
