import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Peak Blooms",
  description:
    "Peak Blooms Terms of Service. Please read these terms carefully before using our service.",
}

export default function TermsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-semibold font-serif mb-2">Terms of Service</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">1. Agreement to Terms</h2>
        <p className="text-base text-foreground">
          By accessing and using Peak Blooms ("the Service"), you agree to be bound by these Terms
          of Service. If you do not agree to all of these terms and conditions, do not use this
          Service.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">2. Use License</h2>
        <p className="text-base text-foreground">
          Peak Blooms is intended for professional florists and floral businesses. Permission is
          granted to temporarily download one copy of the materials (information or software) on
          Peak Blooms for personal, non-commercial transactional use only. This is the grant of a
          license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-foreground">
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose or for any public display</li>
          <li>Attempt to reverse engineer, decompile, or disassemble the software</li>
          <li>Transmit or collect information for unsolicited purposes</li>
          <li>Interfere with the functioning of the Service or servers</li>
          <li>Circumvent, disable, or otherwise interfere with security-related features</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">3. Account Responsibility</h2>
        <p className="text-base text-foreground">
          When you create an account with Peak Blooms, you agree to:
        </p>
        <ul className="list-disc list-inside space-y-2 text-base text-foreground">
          <li>Provide accurate, complete, and current information</li>
          <li>Maintain the confidentiality of your password and account</li>
          <li>Accept responsibility for all activity under your account</li>
          <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
          <li>Notify us immediately of any unauthorized use of your account</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">4. Account Approval</h2>
        <p>
          Peak Blooms requires approval of new business accounts before granting full access to
          pricing and ordering features. Peak Blooms reserves the right to approve, deny, or suspend
          any account at its sole discretion. Account verification is conducted to ensure compliance
          with these Terms and Peak Blooms policies.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">5. Ordering and Payment</h2>
        <p>
          All orders placed through Peak Blooms constitute an offer to purchase products. Peak
          Blooms reserves the right to accept or refuse any order. Prices are subject to change
          without notice. You agree to pay all charges and fees that you incur, including any
          applicable taxes.
        </p>
        <p>
          Payment is collected upon delivery. Orders include items with fixed prices as well as
          items at market prices, which are determined at the time of delivery. You will be informed
          of the final total for market price items when your delivery is scheduled.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">6. Delivery</h2>
        <p>
          Peak Blooms operates within specific delivery areas. We are not responsible for delays
          caused by weather, natural disasters, or circumstances beyond our control. Delivery
          timeframes are estimates and not guaranteed.
        </p>
        <p>
          Risk of loss for products transfers to you upon delivery. You are responsible for
          inspecting products upon receipt. See our Returns & Refunds policy for information about
          damaged or defective orders.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">7. Returns and Refunds</h2>
        <p>
          Returns and refunds are governed by our Returns & Refunds policy, which is incorporated
          into these Terms. Please review that policy for details on eligibility and procedures.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">8. Intellectual Property</h2>
        <p>
          All materials on Peak Blooms, including but not limited to content, design, text,
          graphics, images, and arrangement ideas, are the property of Peak Blooms or licensed to
          Peak Blooms and are protected by applicable copyright and trademark laws.
        </p>
        <p>
          You may not reproduce, distribute, transmit, modify, or create derivative works from any
          materials without prior written consent from Peak Blooms, except as expressly permitted by
          these Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">9. User-Generated Content</h2>
        <p>
          If you submit reviews, feedback, photos, or other content to Peak Blooms, you grant us a
          non-exclusive, royalty-free license to use that content for promotional and business
          purposes.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">10. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, Peak Blooms and its affiliates, officers,
          employees, and agents shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages resulting from your use of or inability to use the
          Service, including but not limited to lost profits, data loss, or business interruption.
        </p>
        <p>
          Our total liability to you shall not exceed the amount paid by you to Peak Blooms in the
          past 12 months.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">11. Disclaimer of Warranties</h2>
        <p>
          Peak Blooms is provided on an "as-is" and "as-available" basis. We make no warranties,
          express or implied, regarding the Service, including but not limited to warranties of
          merchantability, fitness for a particular purpose, or non-infringement.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">12. Indemnification</h2>
        <p>
          You agree to indemnify, defend, and hold harmless Peak Blooms and its affiliates,
          officers, employees, and agents from any claims, damages, losses, liabilities, and
          expenses arising from your use of the Service or violation of these Terms.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">13. Termination</h2>
        <p>
          Peak Blooms may terminate or suspend your account and access to the Service at any time,
          for any reason, without notice or liability. Upon termination, your right to use the
          Service will immediately cease.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">14. Governing Law</h2>
        <p>
          These Terms shall be governed by and construed in accordance with the laws of California,
          without regard to its conflict of law provisions. Any legal action or proceeding shall be
          brought exclusively in the courts of California.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">15. Modifications to Terms</h2>
        <p>
          Peak Blooms reserves the right to modify these Terms at any time. Changes will be
          effective immediately upon posting to the website. Your continued use of the Service
          following the posting of revised Terms means that you accept and agree to the changes.
        </p>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold font-serif">Contact Us</h2>
        <p className="text-base text-foreground leading-relaxed">
          If you have questions about these Terms of Service, please contact us at:
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <strong>Email</strong>
            {" - "}
            <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
              hello@peakblooms.com
            </a>
          </p>
          <p>
            <strong>Phone</strong>
            {" - "}
            <a href="tel:6199321139" className="text-[#B45F68] hover:underline">
              (619) 932-1139
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
