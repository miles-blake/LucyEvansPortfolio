import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewsletterForm from "@/components/newsletter/NewsletterForm";
import { ArrowRight } from "lucide-react";

export const revalidate = 3600;

async function getFeaturedContent() {
  const [photo, piece] = await Promise.all([
    prisma.photo.findFirst({ where: { featured: true } }),
    prisma.portfolioPiece.findFirst({ where: { featured: true } }),
  ]);
  return { photo, piece };
}

export default async function HomePage() {
  const { photo, piece } = await getFeaturedContent();

  return (
    <>
      {/* ── Split Hero ─────────────────────────────────────────── */}
      <section aria-label="Welcome" className="relative w-full overflow-hidden" style={{ minHeight: "90svh" }}>
        <div className="flex flex-col md:flex-row h-full" style={{ minHeight: "90svh" }}>

          {/* Photography panel */}
          <div className="relative flex-1 flex flex-col justify-end p-8 md:p-16 min-h-[50svh] md:min-h-0 group overflow-hidden">
            <Image
              src="https://picsum.photos/seed/hero-photo/900/1200"
              alt="Golden hour landscape on film"
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-sky/80 via-sage/50 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

            <div className="relative z-10">
              <p className="font-meta text-cream/80 mb-3">Film Photography</p>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream leading-tight mb-4">
                Landscapes on<br />medium format film.
              </h1>
              <p className="text-cream/80 text-base md:text-lg mb-8 max-w-sm">
                Digital downloads and prints. Landscape photography from Utah, the Rockies, and beyond.
              </p>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 bg-cream text-ink px-6 py-3 font-medium text-sm hover:bg-cream/90 transition-colors focus-visible:outline-2 focus-visible:outline-cream rounded-sm"
              >
                Browse the gallery <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Curved SVG divider — desktop only */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-24 z-20 pointer-events-none">
            <svg
              viewBox="0 0 96 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full"
              aria-hidden="true"
            >
              <path
                d="M48 0 C60 20, 36 40, 48 60 C60 80, 36 90, 48 100 L96 100 L96 0 Z"
                fill="#FAF6EF"
                opacity="0.08"
              />
              <path
                d="M48 0 C60 20, 36 40, 48 60 C60 80, 36 90, 48 100"
                fill="none"
                stroke="#FAF6EF"
                strokeWidth="1"
                opacity="0.3"
              />
            </svg>
          </div>

          {/* Marketing panel */}
          <div className="relative flex-1 flex flex-col justify-end p-8 md:p-16 min-h-[50svh] md:min-h-0 group overflow-hidden">
            <Image
              src="https://picsum.photos/seed/hero-marketing/900/1200"
              alt="Behind the scenes content creation"
              fill
              priority
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-bl from-blush/80 via-rose/40 to-transparent mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

            <div className="relative z-10">
              <p className="font-meta text-cream/80 mb-3">Content Marketing</p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl text-cream leading-tight mb-4">
                Short-form content<br />that converts.
              </h2>
              <p className="text-cream/80 text-base md:text-lg mb-8 max-w-sm">
                TikToks and Reels for brands. Case studies, metrics, and a media kit for prospective employers.
              </p>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 bg-cream text-ink px-6 py-3 font-medium text-sm hover:bg-cream/90 transition-colors focus-visible:outline-2 focus-visible:outline-cream rounded-sm"
              >
                View my work <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Photo ─────────────────────────────────────── */}
      {photo && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-meta text-muted-foreground mb-2">Latest print</p>
              <h2 className="font-display text-3xl md:text-4xl text-ink">From the darkroom.</h2>
            </div>
            <Link
              href="/gallery"
              className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink transition-colors"
            >
              All prints <ArrowRight size={14} />
            </Link>
          </div>

          <Link href={`/gallery/${photo.slug}`} className="group block">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted rounded-sm">
                <Image
                  src={photo.previewImageUrl}
                  alt={photo.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {photo.isLimitedEdition && (
                  <span className="absolute top-4 left-4 font-meta text-cream bg-ink/80 px-2 py-1">
                    Limited edition — {photo.editionSize! - photo.editionSold} of {photo.editionSize} remaining
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-display text-3xl md:text-4xl text-ink mb-6 group-hover:opacity-80 transition-opacity">
                  {photo.title}
                </h3>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 mb-6 border-t border-border pt-6">
                  {photo.filmStock && (
                    <>
                      <dt className="font-meta text-muted-foreground">Film</dt>
                      <dd className="font-meta text-ink">{photo.filmStock}</dd>
                    </>
                  )}
                  {photo.camera && (
                    <>
                      <dt className="font-meta text-muted-foreground">Camera</dt>
                      <dd className="font-meta text-ink">{photo.camera}</dd>
                    </>
                  )}
                  {photo.location && (
                    <>
                      <dt className="font-meta text-muted-foreground">Location</dt>
                      <dd className="font-meta text-ink">{photo.location}</dd>
                    </>
                  )}
                  {photo.captureDate && (
                    <>
                      <dt className="font-meta text-muted-foreground">Date</dt>
                      <dd className="font-meta text-ink">
                        {photo.captureDate.toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })}
                      </dd>
                    </>
                  )}
                </dl>

                {photo.description && (
                  <p className="text-muted-foreground leading-relaxed mb-8">
                    {photo.description}
                  </p>
                )}

                <div className="flex items-center gap-4">
                  <span className="font-display text-2xl text-ink">
                    ${(photo.price / 100).toFixed(0)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-ink group-hover:gap-2 transition-all">
                    View print <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div className="mt-8 sm:hidden">
            <Link
              href="/gallery"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink transition-colors"
            >
              All prints <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* ── Featured Case Study ────────────────────────────────── */}
      {piece && (
        <section className="bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="font-meta text-muted-foreground mb-2">Selected work</p>
                <h2 className="font-display text-3xl md:text-4xl text-ink">Content that moves.</h2>
              </div>
              <Link
                href="/work"
                className="hidden sm:inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-ink transition-colors"
              >
                All case studies <ArrowRight size={14} />
              </Link>
            </div>

            <Link href={`/work/${piece.slug}`} className="group block">
              <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
                <div className="relative aspect-video overflow-hidden bg-blush/20 rounded-sm">
                  {piece.coverImageUrl ? (
                    <Image
                      src={piece.coverImageUrl}
                      alt={piece.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-blush to-rose/40" />
                  )}
                </div>

                <div>
                  <p className="font-meta text-rose mb-3">{piece.brandName}</p>
                  <h3 className="font-display text-3xl md:text-4xl text-ink mb-4 group-hover:opacity-80 transition-opacity">
                    {piece.title}
                  </h3>
                  {piece.metrics && (
                    <p className="font-meta text-ink border-l-2 border-rose pl-4 mb-6">
                      {piece.metrics}
                    </p>
                  )}
                  {piece.description && (
                    <p className="text-muted-foreground leading-relaxed mb-8 line-clamp-3">
                      {piece.description}
                    </p>
                  )}
                  {piece.testimonialQuote && (
                    <blockquote className="border-t border-border pt-6">
                      <p className="text-ink italic leading-relaxed mb-2">
                        &ldquo;{piece.testimonialQuote}&rdquo;
                      </p>
                      {piece.testimonialAuthor && (
                        <cite className="font-meta text-muted-foreground not-italic">
                          — {piece.testimonialAuthor}
                        </cite>
                      )}
                    </blockquote>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Newsletter ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-xl mx-auto text-center">
          <p className="font-meta text-muted-foreground mb-3">The dispatch</p>
          <h2 className="font-display text-3xl md:text-4xl text-ink mb-4">
            Stay in the loop.
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">
            New prints when they drop, case studies I&apos;m proud of, and the occasional field note. No noise.
          </p>
          <NewsletterForm source="homepage" className="max-w-sm mx-auto" />
        </div>
      </section>
    </>
  );
}
