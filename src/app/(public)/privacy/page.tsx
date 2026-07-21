import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Lucy Evans collects, uses, and protects your information.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 prose-content">
      <h1 className="font-display text-4xl text-ink mb-2">Privacy Policy</h1>
      <p className="font-meta text-sm text-muted-foreground mb-10">Last updated July 20, 2026</p>

      <Section title="What we collect">
        <p>When you make a purchase, we collect your name, email address, and payment information (processed securely by Stripe — we never store card numbers). When you book a photography session, we also collect your phone number and event details. When you subscribe to the newsletter, we store your email address.</p>
      </Section>

      <Section title="How we use it">
        <ul>
          <li>To process payments and deliver digital downloads</li>
          <li>To confirm and coordinate photography bookings</li>
          <li>To send the newsletter you signed up for (you can unsubscribe at any time)</li>
          <li>To respond to inquiries</li>
        </ul>
        <p>We do not sell, rent, or share your personal information with third parties except as required to process payments (Stripe) or send email (Resend).</p>
      </Section>

      <Section title="Cookies">
        <p>This site uses a session cookie to keep you logged in to the admin panel, and a localStorage entry for your shopping cart. No tracking or advertising cookies are used.</p>
      </Section>

      <Section title="Data retention">
        <p>Order records are retained for seven years for accounting purposes. Booking records are retained for three years. Newsletter subscriber records are retained until you unsubscribe.</p>
      </Section>

      <Section title="Your rights">
        <p>You may request access to, correction of, or deletion of your personal data at any time by emailing <a href="mailto:hello@lucyevans.com" className="text-ink underline">hello@lucyevans.com</a>.</p>
      </Section>

      <Section title="Contact">
        <p>Lucy Evans Photography<br />Utah County, Utah<br /><a href="mailto:hello@lucyevans.com" className="text-ink underline">hello@lucyevans.com</a></p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl text-ink mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </section>
  );
}
