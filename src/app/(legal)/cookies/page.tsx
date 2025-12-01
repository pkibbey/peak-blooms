import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy - Peak Blooms",
  description:
    "Peak Blooms Cookie Policy. Learn how we use cookies and how to manage your preferences.",
}

export default function CookiesPage() {
  return (
    <div className="space-y-6 text-base text-foreground">
      <div>
        <h1 className="text-4xl font-semibold mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: December 2024</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device (computer, tablet, or
          smartphone) when you visit a website. They help websites remember information about you,
          such as your preferences or login status, and are commonly used to enhance user
          experience.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">How Peak Blooms Uses Cookies</h2>
        <p>Peak Blooms uses cookies for the following purposes:</p>
        <h3 className="text-lg font-semibold text-[#1F332E]">Essential Cookies</h3>
        <p>
          These cookies are necessary for the website to function properly. They enable you to
          navigate the site, maintain your session, and access secure features.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Session cookies for authentication and account management</li>
          <li>Security cookies to prevent fraud and protect your account</li>
          <li>Cookies required for form submission and navigation</li>
        </ul>

        <h3 className="text-lg font-semibold text-[#1F332E] mt-4">Performance Cookies</h3>
        <p>
          These cookies help us understand how you use Peak Blooms so we can improve the website and
          your experience.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Analytics cookies to track page views and user interactions</li>
          <li>Performance cookies to measure website load times and functionality</li>
          <li>Cookies to understand which features are most popular</li>
        </ul>

        <h3 className="text-lg font-semibold text-[#1F332E] mt-4">Preference Cookies</h3>
        <p>These cookies remember your choices to personalize your experience.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Language and region preferences</li>
          <li>Display preferences and settings</li>
          <li>Items saved to your cart or wishlist</li>
        </ul>

        <h3 className="text-lg font-semibold text-[#1F332E] mt-4">Marketing Cookies</h3>
        <p>
          These cookies are used to deliver targeted advertising and track the effectiveness of
          marketing campaigns.
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cookies for retargeting advertisements</li>
          <li>Cookies to measure campaign effectiveness</li>
          <li>Cookies shared with advertising partners</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Third-Party Cookies</h2>
        <p>
          We may allow third-party service providers (such as analytics and advertising partners) to
          place cookies on your device. These third parties have their own cookie policies and may
          use the information collected for their own purposes.
        </p>
        <p>Common third parties include:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Google Analytics:</strong> For website analytics and traffic measurement
          </li>
          <li>
            <strong>Payment Processors:</strong> For secure payment processing
          </li>
          <li>
            <strong>Advertising Networks:</strong> For targeted advertising
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">How Long Do Cookies Last?</h2>
        <p>Cookies have different lifespans:</p>
        <ul className="list-disc list-inside space-y-2">
          <li>
            <strong>Session Cookies:</strong> These are temporary and deleted when you close your
            browser.
          </li>
          <li>
            <strong>Persistent Cookies:</strong> These remain on your device for a specified period
            (ranging from days to years) until you manually delete them or they expire.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Managing Your Cookie Preferences</h2>
        <p>
          You have control over how cookies are used on your device. Most browsers allow you to
          refuse cookies or alert you when cookies are being sent.
        </p>
        <h3 className="text-lg font-semibold text-[#1F332E]">Browser Controls</h3>
        <p>You can typically manage cookies through your browser settings:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Chrome: Visit chrome://settings/cookies</li>
          <li>Firefox: Go to Preferences &gt; Privacy &amp; Security &gt; Cookies</li>
          <li>Safari: Preferences &gt; Privacy &gt; Cookies and website data</li>
          <li>Edge: Settings &gt; Privacy &gt; Cookies</li>
        </ul>
        <p className="mt-3">
          For instructions on managing cookies in other browsers, consult your browser's help
          documentation.
        </p>

        <h3 className="text-lg font-semibold text-[#1F332E] mt-4">Opt-Out of Marketing Cookies</h3>
        <p>
          You can opt out of certain marketing and tracking cookies. However, disabling cookies may
          affect website functionality and your browsing experience.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Impact of Disabling Cookies</h2>
        <p>If you disable cookies, certain features of Peak Blooms may not function properly:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>You may not be able to stay logged in</li>
          <li>Your preferences and saved items may not be remembered</li>
          <li>Some website features may be unavailable</li>
          <li>Analytics will be less accurate, which we use to improve the site</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Do Not Track (DNT)</h2>
        <p>
          Some browsers include a "Do Not Track" feature. Currently, there is no industry standard
          for recognizing DNT signals. Peak Blooms does not currently respond to DNT browser
          signals, but we respect your privacy choices through other means.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Policy Updates</h2>
        <p>
          Peak Blooms may update this Cookie Policy from time to time to reflect changes in our
          practices or applicable law. We will notify you of material changes by updating the "Last
          Updated" date and, if applicable, by posting a notice on our website.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold">Questions?</h2>
        <p>
          If you have questions about our use of cookies or this Cookie Policy, please contact us
          at:
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <p>
            <strong>Email:</strong>{" "}
            <a href="mailto:hello@peakblooms.com" className="text-[#B45F68] hover:underline">
              hello@peakblooms.com
            </a>
          </p>
          <p>
            <strong>Phone:</strong>{" "}
            <a href="tel:6199321139" className="text-[#B45F68] hover:underline">
              (619) 932-1139
            </a>
          </p>
        </div>
      </section>
    </div>
  )
}
