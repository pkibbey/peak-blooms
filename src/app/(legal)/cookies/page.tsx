import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Cookie Policy - Peak Blooms",
  description:
    "Peak Blooms Cookie Policy. Learn how we use cookies and how to manage your preferences.",
}

export default function CookiesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl md:text-5xl font-semibold font-serif mb-2">Cookie Policy</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">What Are Cookies?</h2>
        <p>
          Cookies are small text files that are stored on your device (computer, tablet, or
          smartphone) when you visit a website. They help websites remember information about you,
          such as your preferences or login status, and are commonly used to enhance user
          experience.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">How Peak Blooms Uses Cookies</h2>
        <p>
          Peak Blooms uses cookies exclusively for essential authentication and security purposes:
        </p>
        <h3 className="text-lg font-semibold text-[#1F332E]">Authentication Cookies</h3>
        <p className="text-base text-foreground">
          These cookies are strictly necessary for the website to function. They enable you to log
          in, maintain your session, and access your account securely.
        </p>
        <ul className="list-disc list-inside space-y-1 text-base text-foreground">
          <li>Session cookies to keep you logged in</li>
          <li>Security cookies to protect against unauthorized access</li>
          <li>Cookies required for account management</li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">How Long Do Cookies Last?</h2>
        <p className="text-base text-foreground">Cookies have different lifespans:</p>
        <ul className="list-disc list-inside space-y-2 text-base text-foreground">
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

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">Managing Your Cookies</h2>
        <p className="text-base text-foreground">
          Since Peak Blooms uses authentication cookies that are essential for the website to
          function, they cannot be disabled without affecting your ability to log in and access your
          account.
        </p>
        <p className="text-base text-foreground">
          If you wish to manage cookies on your device, you can adjust your browser settings:
        </p>
        <ul className="list-disc list-inside space-y-1 text-base text-foreground">
          <li>Chrome: Visit chrome://settings/cookies</li>
          <li>Firefox: Go to Preferences &gt; Privacy &amp; Security &gt; Cookies</li>
          <li>Safari: Preferences &gt; Privacy &gt; Cookies and website data</li>
          <li>Edge: Settings &gt; Privacy &gt; Cookies</li>
        </ul>
        <p className="mt-3 text-base text-foreground">
          Please note that disabling cookies will prevent you from logging in to your account.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">California Privacy</h2>
        <p className="text-base text-foreground">
          Peak Blooms operates in California and complies with applicable California privacy laws.
          Since we only use authentication cookies that are strictly necessary for website
          functionality, additional cookie consent is not required under California law.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold font-serif">Policy Updates</h2>
        <p className="text-base text-foreground">
          Peak Blooms may update this Cookie Policy from time to time to reflect changes in our
          practices or applicable law. We will notify you of material changes by updating the "Last
          Updated" date and, if applicable, by posting a notice on our website.
        </p>
      </section>

      <section className="space-y-4 border-t border-border pt-8">
        <h2 className="text-2xl font-semibold font-serif">Questions?</h2>
        <p className="text-base text-foreground leading-relaxed">
          If you have questions about our use of cookies or this Cookie Policy, please contact us
          at:
        </p>
        <div className="space-y-1 text-sm">
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
        </div>
      </section>
    </div>
  )
}
