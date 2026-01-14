import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ - Peak Blooms",
  description:
    "Frequently asked questions about ordering, pricing, accounts, and our wholesale flower service.",
}

import type React from "react"

interface FAQItem {
  question: string
  answer: React.ReactNode
}

const faqs: FAQItem[] = [
  {
    question: "Who can order from Peak Blooms?",
    answer:
      "Peak Blooms is designed for professional florists and floral businesses. When you sign up, you'll need to provide information about your business so we can verify your account. Once approved by our team, you'll have full access to our catalog, pricing, and ordering system.",
  },
  {
    question: "Is there a minimum order amount?",
    answer:
      "We offer flexible ordering to meet businesses of all sizes. While we don't enforce a strict minimum, most florists find that ordering stems by the bunch or pre-made bouquets aligns well with how they source flowers. Our sales team can discuss volume options that work for your specific needs.",
  },
  {
    question: "What's your return policy?",
    answer:
      "We stand behind the quality of every flower we ship. If you receive damaged or subpar flowers, contact us within 24 hours of delivery with photos, and we'll work with you to make it right. See our full Returns & Refunds policy for more details.",
  },
  {
    question: "Do you offer the same flowers year-round?",
    answer:
      "We celebrate what's in season. Our inventory shifts throughout the year to feature the freshest, most vibrant flowers available from our growers. This means better quality, better pricing, and more creative options for your arrangements. Check our Collections and Inspirations to see what's currently available.",
  },
  {
    question: "How fresh are the flowers when they arrive?",
    answer:
      "Freshness is our priority. Most flowers are cut within 24-48 hours of delivery and arrive at peak bloom stage. We use specialized packaging and coordinate with local delivery partners to ensure minimal time in transit. You'll get a delivery window so you can plan accordingly.",
  },
  {
    question: "Can I place a rush order?",
    answer: (
      <>
        Yes, we can often accommodate rush orders depending on availability and timing. Contact us
        directly at{" "}
        <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
          hello@peakblooms.com
        </a>{" "}
        or{" "}
        <a href="tel:6199321139" className="text-[#B45F68] hover:underline">
          (619) 932-1139
        </a>{" "}
        to discuss your urgent needs. Our team will do our best to help you.
      </>
    ),
  },
  {
    question: "How do I create an inspirational arrangement?",
    answer:
      "Our Inspirations section showcases full arrangements that you can reference or order directly. You'll see ingredient lists, styling notes, and seasonal tips. You can use these as templates for your own creations or order them as-is for events or tastings.",
  },
  {
    question: "Is there a wholesale discount?",
    answer:
      "Our pricing is already at wholesale rates for approved business customers. We don't offer additional tiered discounts, but we do offer competitive, transparent pricing with no hidden fees. Larger, regular orders may qualify for special arrangements—reach out to discuss your needs.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "Payment is collected upon delivery. This allows us to handle market price items flexibly, as prices may fluctuate based on seasonal availability. You'll be informed of any market price items when your delivery is scheduled.",
  },
  {
    question: "How can I update my account information?",
    answer:
      "You can update your profile, email, and addresses from your Account page after logging in. If you need to change your business information or update your pricing tier, contact us directly.",
  },
]

export default function FAQPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-semibold font-serif mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-muted-foreground">
          Common questions about ordering, our service, and Peak Blooms.
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq) => (
          <section key={faq.question} className="space-y-3">
            <h2 className="text-2xl font-semibold font-serif">{faq.question}</h2>
            <p className="text-base text-foreground leading-relaxed">{faq.answer}</p>
          </section>
        ))}
      </div>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold font-serif">Didn't find your answer?</h2>
        <p className="text-base text-foreground">
          Reach out to our team at{" "}
          <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
            hello@peakblooms.com
          </a>{" "}
          or call{" "}
          <a href="tel:6199321139" className="text-[#B45F68] hover:underline">
            (619) 932-1139
          </a>
          . We're here to help!
        </p>
      </section>
    </div>
  )
}
