import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using lucyevans.com.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl text-ink mb-2">Terms of Service</h1>
      <p className="font-meta text-sm text-muted-foreground mb-10">Last updated July 20, 2026</p>

      <Section title="Use of this site">
        <p>By using lucyevans.com you agree to these terms. If you do not agree, please do not use this site.</p>
      </Section>

      <Section title="Digital downloads">
        <p>Upon completed payment, you receive a non-exclusive, non-transferable personal-use license to the purchased digital files. You may print, display, and share images for personal, non-commercial purposes. You may not resell, sublicense, or use images in commercial projects without a separate commercial license agreement.</p>
        <p>Download links expire 30 days after purchase and are limited to 5 downloads per file. If you lose access, email us and we will reissue the link within 48 hours.</p>
      </Section>

      <Section title="Booking deposits">
        <p>The 50% deposit paid at booking is non-refundable if you cancel within 14 days of your event date. Cancellations made more than 14 days before the event date receive a full deposit refund. Deposits may be transferred to a rescheduled date at no additional cost (once, within 12 months).</p>
      </Section>

      <Section title="Intellectual property">
        <p>All photographs and creative content on this site are the intellectual property of Lucy Evans. Unauthorized reproduction, commercial use, or redistribution is prohibited.</p>
      </Section>

      <Section title="Limitation of liability">
        <p>To the maximum extent permitted by law, Lucy Evans Photography is not liable for indirect, incidental, or consequential damages arising from your use of this site or purchased products.</p>
      </Section>

      <Section title="Governing law">
        <p>These terms are governed by the laws of the State of Utah, United States.</p>
      </Section>

      <Section title="Contact">
        <p>Questions? Email <a href="mailto:hello@lucyevans.com" className="text-ink underline">hello@lucyevans.com</a>.</p>
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
