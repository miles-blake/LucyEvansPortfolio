import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import VideoPlayer from "@/components/work/VideoPlayer";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const piece = await prisma.portfolioPiece.findUnique({ where: { slug } });
  if (!piece) return {};
  return {
    title: piece.title,
    description: piece.description ?? undefined,
    openGraph: {
      title: piece.title,
      description: piece.description ?? undefined,
      images: piece.coverImageUrl ? [piece.coverImageUrl] : [],
    },
  };
}


export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const piece = await prisma.portfolioPiece.findUnique({ where: { slug } });
  if (!piece) notFound();

  const related = await prisma.portfolioPiece.findMany({
    where: {
      id: { not: piece.id },
      tags: { hasSome: piece.tags },
    },
    take: 2,
    orderBy: { dateCompleted: "desc" },
  });

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Back link */}
      <Link
        href="/work"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors mb-10 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft size={14} /> All work
      </Link>

      {/* Header */}
      <div className="mb-12">
        <p className="font-meta text-rose mb-3">{piece.brandName}</p>
        <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-ink mb-4 leading-tight">
          {piece.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {piece.role && (
            <span className="font-meta text-muted-foreground">{piece.role}</span>
          )}
          {piece.dateCompleted && (
            <span className="font-meta text-muted-foreground">
              {piece.dateCompleted.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
        {/* Videos + cover — left 2 cols */}
        <div className="lg:col-span-2 space-y-8">
          {/* Cover image (if no videos) */}
          {piece.videoUrls.length === 0 && piece.coverImageUrl && (
            <div className="relative aspect-video rounded-sm overflow-hidden bg-muted">
              <Image
                src={piece.coverImageUrl}
                alt={piece.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
              />
            </div>
          )}

          {/* Video reel(s) */}
          {piece.videoUrls.length > 0 && (
            <div>
              <p className="font-meta text-muted-foreground mb-4">
                {piece.videoUrls.length > 1 ? "Videos" : "Video"}
              </p>
              <div className="flex flex-wrap gap-6">
                {piece.videoUrls.map((url, i) => (
                  <VideoPlayer
                    key={url}
                    src={url}
                    originalUrl={piece.originalPostUrls[i]}
                    title={`${piece.title} — video ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {piece.description && (
            <div>
              <p className="font-meta text-muted-foreground mb-3">Overview</p>
              <p className="text-ink leading-relaxed text-lg">{piece.description}</p>
            </div>
          )}

          {/* Testimonial */}
          {piece.testimonialQuote && (
            <blockquote className="border-l-4 border-rose pl-6 py-2">
              <p className="font-display text-2xl text-ink italic leading-relaxed mb-4">
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

        {/* Sidebar — right col */}
        <div className="space-y-8">
          {/* Metrics */}
          {piece.metrics && (
            <div className="bg-muted rounded-sm p-6">
              <p className="font-meta text-muted-foreground mb-3">Results</p>
              <p className="text-ink leading-relaxed">{piece.metrics}</p>
            </div>
          )}

          {/* Deliverables */}
          {piece.deliverables && (
            <div>
              <p className="font-meta text-muted-foreground mb-3">Deliverables</p>
              <p className="text-ink leading-relaxed text-sm">{piece.deliverables}</p>
            </div>
          )}

          {/* Tags */}
          {piece.tags.length > 0 && (
            <div>
              <p className="font-meta text-muted-foreground mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {piece.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/work?tag=${encodeURIComponent(tag)}`}
                    className="font-meta text-muted-foreground border border-border px-2 py-0.5 hover:border-rose/50 hover:text-ink transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Original post links */}
          {piece.originalPostUrls.length > 0 && (
            <div>
              <p className="font-meta text-muted-foreground mb-3">Original posts</p>
              <ul className="space-y-2">
                {piece.originalPostUrls.map((url, i) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-meta text-ink hover:text-rose transition-colors"
                    >
                      View post {piece.originalPostUrls.length > 1 ? i + 1 : ""} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-border pt-6">
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Interested in working together?
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-ink text-cream px-5 py-2.5 text-sm font-medium hover:bg-ink/80 transition-colors focus-visible:outline-2 focus-visible:outline-ring rounded-sm"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </div>

      {/* Related work */}
      {related.length > 0 && (
        <section className="mt-20 pt-12 border-t border-border">
          <p className="font-meta text-muted-foreground mb-6">More work</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/work/${p.slug}`}
                className="group flex gap-4 items-center border border-border rounded-sm p-4 hover:border-rose/50 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
              >
                {p.coverImageUrl && (
                  <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                    <Image
                      src={p.coverImageUrl}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="80px"
                    />
                  </div>
                )}
                <div>
                  <p className="font-meta text-rose text-xs mb-1">{p.brandName}</p>
                  <p className="font-display text-base text-ink group-hover:opacity-80 transition-opacity">
                    {p.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
