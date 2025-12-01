import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Returns & Refunds - Peak Blooms",
  description: "Peak Blooms returns and refund policy. We stand behind every flower we send.",
}

export default function ReturnsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Returns & Refunds</h1>
        <p className="text-lg text-muted-foreground">
          We stand behind the quality of every flower. Here's our returns policy.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Quality Promise</h2>
        <p className="text-base text-foreground leading-relaxed">
          Peak Blooms is committed to delivering the freshest, highest-quality flowers every time.
          We take pride in our sourcing, preparation, and packaging. If you receive flowers that
          don't meet our standards, we want to know and we'll make it right.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What Qualifies for Return or Refund</h2>
        <p className="text-base text-foreground leading-relaxed">
          The following qualify for a return, replacement, or refund:
        </p>
        <ul className="space-y-2 text-base text-foreground">
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Damaged Flowers</span>
            <span>Flowers that arrive with broken stems, crushed petals, or visible damage.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Poor Quality</span>
            <span>
              Flowers that are discolored, wilting, or otherwise don't meet freshness standards upon
              arrival.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Wrong Items</span>
            <span>If you received flowers different from what you ordered.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Insufficient Quantity</span>
            <span>If your order was incomplete or under-counted.</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">How to Request a Return or Refund</h2>
        <p className="text-base text-foreground leading-relaxed">
          If you're not satisfied with your order, contact us within{" "}
          <strong>24 hours of delivery</strong> with:
        </p>
        <ol className="space-y-2 text-base text-foreground list-decimal list-inside">
          <li>Your order number</li>
          <li>Clear photos of the affected flowers</li>
          <li>A brief description of the issue</li>
          <li>Your preferred resolution (replacement, refund, credit)</li>
        </ol>
        <p className="text-base text-foreground leading-relaxed mt-4">
          Email us at{" "}
          <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
            hello@peakblooms.com
          </a>{" "}
          or call{" "}
          <a href="tel:6199321139" className="text-[#B45F68] hover:underline">
            (619) 932-1139
          </a>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Resolution Options</h2>
        <p className="text-base text-foreground leading-relaxed">
          When we confirm a valid return, we'll typically offer one of the following:
        </p>
        <ul className="space-y-2 text-base text-foreground">
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Replacement</span>
            <span>We'll prepare and send a replacement order at no additional cost.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Full Refund</span>
            <span>We'll refund the full purchase price to your original payment method.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Account Credit</span>
            <span>We'll apply a credit to your Peak Blooms account for future orders.</span>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">What Does NOT Qualify</h2>
        <p className="text-base text-foreground leading-relaxed">
          The following do not qualify for return or refund:
        </p>
        <ul className="space-y-2 text-base text-foreground list-disc list-inside">
          <li>
            Flowers that were not properly cared for after delivery (e.g., not trimmed, placed in
            sunlight, not hydrated)
          </li>
          <li>Natural wilting or senescence after normal use (flowers have a natural lifespan)</li>
          <li>
            Change of mind or incorrect order placed by customer (see Order Modifications below)
          </li>
          <li>Damage caused by improper handling or storage after delivery</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Order Modifications & Cancellations</h2>
        <p className="text-base text-foreground leading-relaxed">
          If you need to modify or cancel an order, contact us as soon as possible. Orders placed
          before 2pm can often be modified same-day. Once flowers have been cut and packed,
          modifications may not be possible, but we'll do our best to help.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          Cancellations requested more than 24 hours before delivery are generally subject to a 15%
          processing fee. Cancellations within 24 hours of delivery may not be possible depending on
          preparation status.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Refund Timeline</h2>
        <p className="text-base text-foreground leading-relaxed">
          Once we've confirmed your return, refunds are processed within 3-5 business days. The
          refund will be credited to your original payment method. Depending on your bank, the
          credit may take an additional 1-3 business days to appear.
        </p>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold">Have Questions?</h2>
        <p className="text-base text-foreground">
          If you have concerns about a past order or questions about our return policy, reach out to
          our team at{" "}
          <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
            hello@peakblooms.com
          </a>
          .
        </p>
      </section>
    </div>
  )
}
