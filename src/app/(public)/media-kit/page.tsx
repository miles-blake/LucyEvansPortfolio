import Link from "next/link";
import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Media Kit",
  description:
    "Lucy Evans — content marketing résumé, skills summary, and downloadable media kit for prospective employers and brand partners.",
};

const skills = [
  {
    category: "Content Creation",
    items: ["Short-form video (TikTok, Reels)", "Scriptwriting & storyboarding", "On-camera performance", "Video editing (CapCut, Premiere Pro)"],
  },
  {
    category: "Strategy",
    items: ["Content calendar planning", "Hook writing & A/B testing", "Paid social creative (UGC ads)", "Trend research & rapid ideation"],
  },
  {
    category: "Analytics",
    items: ["TikTok & Meta analytics", "Engagement rate benchmarking", "Performance reporting", "Creative iteration from data"],
  },
  {
    category: "Photography",
    items: ["Medium format film (Pentax 67, Mamiya RZ67)", "Hasselblad 500C/M, Mamiya 7", "Kodak Portra, Fuji Velvia, Ilford HP5", "Darkroom scanning & digital delivery"],
  },
];

const stats = [
  { value: "4.2M+", label: "Combined video views" },
  { value: "18%", label: "Average engagement rate" },
  { value: "220K", label: "Followers grown for clients" },
  { value: "3+", label: "Years brand content experience" },
];

export default function MediaKitPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-16">
        <p className="font-meta text-muted-foreground mb-3">Media Kit & Résumé</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-6 leading-tight">
          Lucy Evans
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mb-8">
          Content strategist and short-form video creator with a background in film photography.
          I build brand content that earns attention — on TikTok, Instagram Reels, and everywhere people actually watch.
        </p>
        <div className="flex flex-wrap gap-4">
          <a href="/lucy-evans-media-kit.pdf" download>
            <Button className="inline-flex items-center gap-2">
              <Download size={16} />
              Download résumé (PDF)
            </Button>
          </a>
          <Link href="/work">
            <Button variant="outline" className="inline-flex items-center gap-2">
              View case studies <ArrowRight size={16} />
            </Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" className="inline-flex items-center gap-2">
              Get in touch <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-16 rounded-sm overflow-hidden">
        {stats.map(({ value, label }) => (
          <div key={label} className="bg-cream p-6 text-center">
            <p className="font-display text-3xl md:text-4xl text-ink mb-1">{value}</p>
            <p className="font-meta text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Skills */}
      <section className="mb-16">
        <p className="font-meta text-muted-foreground mb-8">Skills & tools</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {skills.map(({ category, items }) => (
            <div key={category}>
              <h2 className="font-display text-lg text-ink mb-4 border-b border-border pb-3">
                {category}
              </h2>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-rose mt-0.5 flex-shrink-0">—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Experience highlights */}
      <section className="mb-16">
        <p className="font-meta text-muted-foreground mb-8">Experience highlights</p>
        <div className="space-y-6">
          {[
            {
              brand: "Lune Cosmetics",
              role: "Content Strategist & Video Creator",
              result: "4.2M combined views, 18% engagement rate, #1 trending sound for 48 hrs",
              href: "/work/lune-cosmetics-launch",
            },
            {
              brand: "Fieldstone Coffee",
              role: "Content Creator & Photographer",
              result: "220K new followers, 3× increase in website traffic from social",
              href: "/work/fieldstone-coffee-brand",
            },
            {
              brand: "Volta Activewear",
              role: "UGC Creator & Creative Strategist",
              result: "$0.08 CPC, 4.5% CTR — 3× above brand benchmarks",
              href: "/work/volta-activewear-ugc",
            },
          ].map(({ brand, role, result, href }) => (
            <Link
              key={brand}
              href={href}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-border rounded-sm p-5 hover:border-rose/50 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div>
                <p className="font-meta text-rose mb-0.5">{brand}</p>
                <p className="font-display text-base text-ink group-hover:opacity-80 transition-opacity">
                  {role}
                </p>
              </div>
              <p className="text-sm text-muted-foreground sm:text-right max-w-xs leading-relaxed">
                {result}
              </p>
            </Link>
          ))}
        </div>
        <div className="mt-6">
          <Link
            href="/work"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink transition-colors"
          >
            Full case studies <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* Photography note */}
      <section className="bg-muted rounded-sm p-8 mb-16">
        <p className="font-meta text-muted-foreground mb-3">Also a film photographer</p>
        <p className="text-ink leading-relaxed mb-4">
          My photography background isn't separate from my content work — it's where I developed my eye.
          Shooting on medium format film teaches you to be deliberate: no spray-and-pray, no filters to hide behind.
          That discipline shows up in how I approach brand content.
        </p>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-1 text-sm text-ink hover:opacity-70 transition-opacity"
        >
          Browse the photography gallery <ArrowRight size={14} />
        </Link>
      </section>

      {/* Contact CTA */}
      <section className="text-center border-t border-border pt-16">
        <h2 className="font-display text-3xl md:text-4xl text-ink mb-4">
          Let&apos;s work together.
        </h2>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
          Open to full-time roles, contract work, and brand partnerships.
          Response time is usually within 24 hours.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="/lucy-evans-media-kit.pdf" download>
            <Button variant="outline" className="inline-flex items-center gap-2">
              <Download size={16} />
              Download résumé
            </Button>
          </a>
          <Link href="/contact">
            <Button className="inline-flex items-center gap-2">
              Send a message <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
