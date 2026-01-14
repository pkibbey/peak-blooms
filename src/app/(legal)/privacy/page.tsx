import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy - Peak Blooms",
  description: "Peak Blooms privacy policy. We take your data privacy seriously.",
}

export default function PrivacyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-semibold font-serif mb-2">Privacy Policy</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">Introduction</h2>
        <p className="text-base text-foreground leading-relaxed">
          Peak Blooms ("we," "our," or "us") is committed to protecting your privacy. This Privacy
          Policy explains how we collect, use, disclose, and safeguard your information when you
          visit our website and use our services.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          Please read this Privacy Policy carefully. If you do not agree with our policies and
          practices, please do not use our services. By accessing and using Peak Blooms, you
          acknowledge that you have read, understood, and agree to be bound by all the provisions of
          this Privacy Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">1. Information We Collect</h2>
        <h3 className="text-lg font-semibold">Information You Provide Directly</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Account Information</strong> - Name, email address, password, business name,
            phone number, and address when you create an account.
          </li>
          <li>
            <strong>Order Information</strong> - Products ordered, delivery address, billing
            information, and payment details.
          </li>
          <li>
            <strong>Communication</strong> - Messages you send us via contact forms, email, or phone
            calls.
          </li>
          <li>
            <strong>Profile Information</strong> - Any additional details you provide to complete
            your business profile.
          </li>
        </ul>

        <h3 className="text-lg font-semibold mt-4">Information Collected Automatically</h3>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Usage Data</strong> - Pages visited, time spent on pages, links clicked, and
            referral sources.
          </li>
          <li>
            <strong>Device Information</strong> - Browser type, device type, IP address, and
            operating system.
          </li>
          <li>
            <strong>Cookies</strong> - We use cookies and similar tracking technologies to enhance
            your experience.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">2. How We Use Your Information</h2>
        <p className="text-base text-foreground leading-relaxed">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>Processing and fulfilling your orders</li>
          <li>Communicating with you about your account and orders</li>
          <li>Responding to your inquiries and customer support requests</li>
          <li>Sending promotional emails and updates (with your consent)</li>
          <li>Improving our website, products, and services</li>
          <li>Conducting analytics and research</li>
          <li>Preventing fraud and ensuring account security</li>
          <li>Complying with legal obligations</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">3. Sharing Your Information</h2>
        <p className="text-base text-foreground leading-relaxed">
          We do not sell, trade, or rent your personal information to third parties. We may share
          your information only in the following circumstances:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Service Providers</strong> - Third-party vendors who assist us in operating our
            website, processing payments, and delivering orders (e.g., payment processors, delivery
            partners).
          </li>
          <li>
            <strong>Legal Requirements</strong> - When required by law or to protect our rights,
            privacy, safety, or property.
          </li>
          <li>
            <strong>Consent</strong> - With your explicit consent for purposes you've authorized.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">4. Data Security</h2>
        <p className="text-base text-foreground leading-relaxed">
          We implement reasonable technical and organizational measures to protect your personal
          information from unauthorized access, alteration, disclosure, or destruction. However, no
          method of transmission over the internet is 100% secure, and we cannot guarantee absolute
          security.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          You are responsible for maintaining the confidentiality of your account credentials. If
          you believe your account has been compromised, please contact us immediately.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">5. Your Rights</h2>
        <p className="text-base text-foreground leading-relaxed">
          Depending on your location, you may have certain rights regarding your personal
          information:
        </p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Access</strong> - The right to request access to your personal information.
          </li>
          <li>
            <strong>Correction</strong> - The right to request correction of inaccurate information.
          </li>
          <li>
            <strong>Deletion</strong> - The right to request deletion of your information (subject
            to legal obligations).
          </li>
          <li>
            <strong>Opt-Out</strong> - The right to opt out of marketing communications.
          </li>
        </ul>
        <p className="mt-3 text-base text-foreground leading-relaxed">
          To exercise any of these rights, please contact us at hello@peakblooms.com.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">6. Cookies</h2>
        <p className="text-base text-foreground leading-relaxed">
          We use cookies to enhance your browsing experience, remember your preferences, and
          understand how you use our site. You can control cookie settings in your browser, though
          some features may not function properly if cookies are disabled.
        </p>
        <p className="text-base text-foreground leading-relaxed">
          For more information about how we use cookies, see our Cookie Policy.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">7. Third-Party Links</h2>
        <p className="text-base text-foreground leading-relaxed">
          Our website may contain links to third-party websites. We are not responsible for the
          privacy practices of these external sites. We encourage you to review the privacy policies
          of any third-party websites before providing your information.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">8. Children's Privacy</h2>
        <p className="text-base text-foreground leading-relaxed">
          Peak Blooms is not intended for children under the age of 13. We do not knowingly collect
          personal information from children. If we learn that we have collected personal
          information from a child under 13, we will delete it promptly.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">9. Policy Updates</h2>
        <p className="text-base text-foreground leading-relaxed">
          We may update this Privacy Policy periodically to reflect changes in our practices or
          legal requirements. We will notify you of significant changes by updating the "Last
          Updated" date and, if applicable, by sending you an email or displaying a notice on our
          website.
        </p>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold font-serif">Contact Us</h2>
        <p className="text-base text-foreground leading-relaxed">
          If you have questions about this Privacy Policy or our privacy practices, please contact
          us at:
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
