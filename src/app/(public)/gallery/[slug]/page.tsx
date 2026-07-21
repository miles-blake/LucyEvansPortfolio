import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { SaveButton } from "@/components/gallery/SaveButton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const photo = await prisma.photo.findUnique({ where: { slug } });
  if (!photo) return {};
  return {
    title: photo.title,
    description: photo.description ?? `${photo.title} — film photography print by Lucy Evans.`,
    openGraph: {
      title: photo.title,
      images: [photo.previewImageUrl],
    },
  };
}

export async function generateStaticParams() {
  const photos = await prisma.photo.findMany({ select: { slug: true } });
  return photos.map((p) => ({ slug: p.slug }));
}

export default async function PhotoDetailPage({ params }: Props) {
  const { slug } = await params;
  const photo = await prisma.photo.findUnique({ where: { slug } });
  if (!photo) notFound();

  // Prev/next within same collection
  const siblings = await prisma.photo.findMany({
    where: photo.collectionTag ? { collectionTag: photo.collectionTag } : {},
    orderBy: { captureDate: "desc" },
    select: { slug: true, title: true },
  });
  const idx = siblings.findIndex((p) => p.slug === slug);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx < siblings.length - 1 ? siblings[idx + 1] : null;

  const editionRemaining = photo.isLimitedEdition && photo.editionSize
    ? photo.editionSize - photo.editionSold
    : null;
  const soldOut = editionRemaining !== null && editionRemaining <= 0;

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Back + breadcrumb */}
      <div className="flex items-center justify-between mb-10">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors focus-visible:outline-2 focus-visible:outline-ring"
        >
          <ArrowLeft size={14} /> Gallery
        </Link>
        {photo.collectionTag && (
          <Link
            href={`/gallery?collection=${encodeURIComponent(photo.collectionTag)}`}
            className="font-meta text-muted-foreground hover:text-ink transition-colors"
          >
            {photo.collectionTag}
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-muted rounded-sm">
          <Image
            src={photo.previewImageUrl}
            alt={photo.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {photo.isLimitedEdition && editionRemaining !== null && (
            <div className="absolute bottom-4 left-4 font-meta text-cream bg-ink/80 px-3 py-1.5 backdrop-blur-sm">
              {soldOut
                ? "Sold out"
                : `${editionRemaining} of ${photo.editionSize} remaining`}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:sticky lg:top-24 space-y-8">
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-ink mb-3 leading-tight">
              {photo.title}
            </h1>
            <p className="font-display text-3xl text-ink">
              ${(photo.price / 100).toFixed(0)}
            </p>
          </div>

          {/* EXIF metadata — contact-sheet style */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-b border-border py-6">
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
            {photo.collectionTag && (
              <>
                <dt className="font-meta text-muted-foreground">Collection</dt>
                <dd className="font-meta text-ink">{photo.collectionTag}</dd>
              </>
            )}
            <dt className="font-meta text-muted-foreground">Format</dt>
            <dd className="font-meta text-ink">Digital download</dd>
          </dl>

          {/* Story */}
          {photo.description && (
            <p className="text-muted-foreground leading-relaxed">{photo.description}</p>
          )}

          {/* License note */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Personal use only. Full-resolution file delivered as a secure download link.{" "}
            <Link href="/license" className="underline underline-offset-2 hover:text-ink transition-colors">
              View license
            </Link>
          </p>

          {/* Add to cart + Save */}
          <div className="flex items-center gap-4">
            <AddToCartButton
              photoId={photo.id}
              title={photo.title}
              price={photo.price}
              disabled={soldOut}
            />
            <SaveButton
              item={{
                id: photo.id,
                slug: photo.slug,
                title: photo.title,
                previewImageUrl: photo.previewImageUrl,
                price: photo.price,
              }}
            />
          </div>

          {/* Prev / Next within collection */}
          {(prev || next) && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              {prev ? (
                <Link
                  href={`/gallery/${prev.slug}`}
                  className="inline-flex items-center gap-1 font-meta text-muted-foreground hover:text-ink transition-colors text-sm"
                >
                  <ArrowLeft size={12} /> {prev.title}
                </Link>
              ) : <span />}
              {next && (
                <Link
                  href={`/gallery/${next.slug}`}
                  className="inline-flex items-center gap-1 font-meta text-muted-foreground hover:text-ink transition-colors text-sm"
                >
                  {next.title} <ArrowRight size={12} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
