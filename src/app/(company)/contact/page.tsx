import type { Metadata } from "next"
import { IconInstagram, IconMail, IconPhone } from "@/components/ui/icons"

export const metadata: Metadata = {
  title: "Contact Peak Blooms",
  description:
    "Get in touch with Peak Blooms. We're here to help with questions about orders, products, or partnership opportunities.",
}

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Get in Touch</h1>
        <p className="text-lg text-muted-foreground">
          Have questions or need assistance? We're here to help.
        </p>
      </div>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">How to Reach Us</h2>
          <p className="text-base text-foreground leading-relaxed mb-6">
            Whether you're a new florist interested in partnering with Peak Blooms, or an existing
            customer with a question about an order, we're happy to help. Reach out to us through
            any of the methods below.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <IconMail className="h-5 w-5 text-[#1F332E] mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-base mb-1">Email</h3>
              <a
                href="mailto:hello@peakblooms.com"
                className="text-base text-[#B45F68] hover:underline break-all"
              >
                hello@peakblooms.com
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Best for detailed questions, order inquiries, and partnership opportunities. We
                typically respond within 24 business hours.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <IconPhone className="h-5 w-5 text-[#1F332E] mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-base mb-1">Phone</h3>
              <a href="tel:6199321139" className="text-base text-[#B45F68] hover:underline">
                (619) 932-1139
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Call us for urgent matters or to discuss your wholesale needs. Available
                Monday-Friday, 8am-5pm Pacific Time.
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <IconInstagram className="h-5 w-5 text-[#1F332E] mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-base mb-1">Instagram</h3>
              <a
                href="https://instagram.com/peakblooms"
                className="text-base text-[#B45F68] hover:underline"
              >
                @peakblooms
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Follow us for inspiration, seasonal highlights, and floral trends. Send us a DM for
                general inquiries.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold">What We're Here For</h2>
        <ul className="space-y-2 text-base text-foreground">
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">General Questions</span>
            <span>Information about our products, pricing, or how Peak Blooms works</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Order Support</span>
            <span>Help with tracking, delivery windows, or order modifications</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Account Issues</span>
            <span>Password resets, account access, or technical difficulties</span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Partnership Inquiry</span>
            <span>
              If you're a grower, distributor, or complementary business interested in working with
              Peak Blooms
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-semibold text-[#1F332E] min-w-fit">Feedback</span>
            <span>Ideas, suggestions, or concerns about our service and platform</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
