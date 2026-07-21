import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Lucy Evans — film photographer and content marketer based in Utah County, Utah.",
};

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Hero */}
      <div className="grid md:grid-cols-2 gap-12 mb-20 items-start">
        <div>
          <p className="font-meta text-muted-foreground mb-3">About</p>
          <h1 className="font-display text-4xl md:text-5xl text-ink mb-6 leading-tight">
            I shoot on film<br />because it forces<br />intention.
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Hi, I&rsquo;m Lucy — a film photographer and content marketer based in Utah County, Utah. I work at the intersection of visual storytelling and brand strategy, which means I can hand you a finished campaign or a framed print, depending on what you need.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-6">
            I shoot on medium format film — mostly Pentax 67, Mamiya RZ67, and Hasselblad. Film slows me down and makes every frame count. That discipline carries into my marketing work too: fewer words, sharper images, cleaner strategy.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/services/book"
              className="inline-flex items-center gap-1.5 bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity"
            >
              Book a session <ArrowRight size={14} />
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center gap-1.5 border border-border text-ink text-sm px-5 py-2.5 rounded-sm hover:border-sky/40 transition-colors"
            >
              View my work
            </Link>
          </div>
        </div>

        {/* Portrait placeholder */}
        <div className="relative aspect-[3/4] bg-sage/10 rounded-sm overflow-hidden">
          <Image
            src="https://picsum.photos/seed/lucy-portrait/600/800"
            alt="Lucy Evans"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>

      {/* What I do */}
      <section className="mb-20">
        <h2 className="font-display text-2xl text-ink mb-8">What I do</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            {
              title: "Film photography",
              body: "Weddings, elopements, portraits, and events. Shot on medium format film, developed at a pro lab, delivered as high-resolution scans. I also sell fine-art prints from my landscape work.",
              cta: { label: "See packages", href: "/services" },
            },
            {
              title: "Content marketing",
              body: "Short-form video, brand storytelling, and UGC for brands that care about craft. I build content systems, not one-off posts — strategy first, then execution.",
              cta: { label: "See case studies", href: "/work" },
            },
          ].map(({ title, body, cta }) => (
            <div key={title} className="border border-border rounded-sm p-6">
              <h3 className="font-display text-lg text-ink mb-3">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{body}</p>
              <Link href={cta.href} className="inline-flex items-center gap-1 text-sm text-ink hover:opacity-70 transition-opacity">
                {cta.label} <ArrowRight size={12} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Gear */}
      <section className="mb-20">
        <h2 className="font-display text-2xl text-ink mb-6">Cameras & film</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { camera: "Pentax 67", note: "My workhorse. Portraits, elopements, most commissions." },
            { camera: "Mamiya RZ67", note: "Studio and controlled light. Exceptional resolution." },
            { camera: "Hasselblad 500C/M", note: "Landscapes and anything where I have time to breathe." },
            { camera: "Mamiya 7", note: "Travel. Lightweight 6×7 rangefinder." },
            { camera: "Nikon F3", note: "35mm when I want speed or grain." },
          ].map(({ camera, note }) => (
            <div key={camera} className="p-4 bg-cream border border-border rounded-sm">
              <p className="font-display text-ink mb-1">{camera}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{note}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
          Film stocks: Kodak Portra 400 and 800, Kodak Ektar 100, Fuji Velvia 50, Fuji Pro 400H, Ilford HP5 Plus. Lab: The Darkroom (Santa Ana, CA).
        </p>
      </section>

      {/* Location */}
      <section className="p-6 bg-sky/10 border border-sky/20 rounded-sm">
        <h3 className="font-display text-ink mb-2">Based in Utah County, Utah</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Travel within 60 miles included in all packages. I&rsquo;m available for destination shoots anywhere — the desert, the mountains, the coast. Travel fees apply for shoots outside the Wasatch Front. Reach out and I&rsquo;ll send you a quote.
        </p>
      </section>
    </div>
  );
}
