import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bundle = await prisma.bundle.findUnique({ where: { slug } });
  if (!bundle) return {};
  return { title: bundle.title, description: bundle.description ?? undefined };
}

export default async function BundleDetailPage({ params }: Props) {
  const { slug } = await params;
  const bundle = await prisma.bundle.findUnique({
    where: { slug },
    include: { photos: { include: { photo: true } } },
  });
  if (!bundle) notFound();

  const photos = bundle.photos.map((bp) => bp.photo);
  const individualTotal = photos.reduce((s, p) => s + p.price, 0);
  const savings = individualTotal - bundle.price;

  return (
    <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Link
        href="/bundles"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors mb-10 focus-visible:outline-2 focus-visible:outline-ring"
      >
        <ArrowLeft size={14} /> All bundles
      </Link>

      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Photo grid */}
        <div className="grid grid-cols-2 gap-px bg-border border border-border">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              href={`/gallery/${photo.slug}`}
              className="group relative block"
            >
              <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                <Image
                  src={photo.previewImageUrl}
                  alt={photo.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/15 transition-colors" />
              </div>
              <div className="px-2 py-1.5 bg-cream border-t border-border">
                <p className="font-meta text-ink text-[10px] truncate">{photo.title}</p>
                {photo.filmStock && (
                  <p className="font-meta text-muted-foreground text-[10px] truncate">{photo.filmStock}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Bundle info */}
        <div className="lg:sticky lg:top-24 space-y-8">
          <div>
            <h1 className="font-display text-4xl md:text-5xl text-ink mb-3 leading-tight">
              {bundle.title}
            </h1>
            <div className="flex items-baseline gap-4">
              <span className="font-display text-3xl text-ink">
                ${(bundle.price / 100).toFixed(0)}
              </span>
              {savings > 0 && (
                <span className="font-meta text-sky">
                  Save ${(savings / 100).toFixed(0)} vs. buying individually
                </span>
              )}
            </div>
          </div>

          {bundle.description && (
            <p className="text-muted-foreground leading-relaxed">{bundle.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-b border-border py-6">
            <dt className="font-meta text-muted-foreground">Prints included</dt>
            <dd className="font-meta text-ink">{photos.length}</dd>
            <dt className="font-meta text-muted-foreground">Format</dt>
            <dd className="font-meta text-ink">Digital downloads</dd>
            <dt className="font-meta text-muted-foreground">Delivery</dt>
            <dd className="font-meta text-ink">Secure link, instant</dd>
          </dl>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Personal use only. Each file is a full-resolution scan.{" "}
            <Link href="/license" className="underline underline-offset-2 hover:text-ink transition-colors">
              View license
            </Link>
          </p>

          <AddToCartButton
            photoId={bundle.id}
            title={bundle.title}
            price={bundle.price}
          />

          {/* Included photos list */}
          <div>
            <p className="font-meta text-muted-foreground mb-4">Included prints</p>
            <ul className="space-y-2">
              {photos.map((photo) => (
                <li key={photo.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/gallery/${photo.slug}`}
                    className="text-ink hover:opacity-70 transition-opacity"
                  >
                    {photo.title}
                  </Link>
                  <span className="font-meta text-muted-foreground">
                    ${(photo.price / 100).toFixed(0)}
                  </span>
                </li>
              ))}
              <li className="flex items-center justify-between text-sm border-t border-border pt-2 mt-2">
                <span className="font-meta text-muted-foreground">Bundle price</span>
                <span className="font-display text-ink">${(bundle.price / 100).toFixed(0)}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  );
}
