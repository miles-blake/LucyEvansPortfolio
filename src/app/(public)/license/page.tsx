import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Image License",
  description: "License terms for digital photographs purchased from lucyevans.com.",
};

export default function LicensePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="font-display text-4xl text-ink mb-2">Image License</h1>
      <p className="font-meta text-sm text-muted-foreground mb-10">Last updated July 20, 2026</p>

      <div className="mb-8 p-5 bg-sage/10 border border-sage/20 rounded-sm">
        <p className="font-display text-ink mb-1">Personal use license — included with every purchase</p>
        <p className="text-muted-foreground text-sm leading-relaxed">All digital downloads include a personal-use license at no extra charge. Commercial use requires a separate agreement.</p>
      </div>

      <Section title="What you can do (personal use)">
        <ul className="space-y-2">
          {[
            "Print the image for personal display (framed at home, etc.)",
            "Share on personal social media accounts with attribution",
            "Use as a personal phone, desktop, or device wallpaper",
            "Include in personal scrapbooks, portfolios, or non-commercial projects",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-sage mt-0.5">✓</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="What requires a commercial license">
        <ul className="space-y-2">
          {[
            "Use in advertising, marketing materials, or branded content",
            "Selling prints or products featuring the image",
            "Editorial use in publications (magazines, blogs, news)",
            "Any use that generates revenue",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-rose mt-0.5">✕</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Attribution">
        <p>When sharing on social media, attribution is appreciated but not required: <span className="font-meta text-ink">Photo © Lucy Evans / lucyevans.com</span></p>
      </Section>

      <Section title="Commercial licensing">
        <p>For commercial use, editorial rights, or extended licensing, please email <a href="mailto:hello@lucyevans.com" className="text-ink underline">hello@lucyevans.com</a> with details about your intended use. Commercial licenses are priced per project.</p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-xl text-ink mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
