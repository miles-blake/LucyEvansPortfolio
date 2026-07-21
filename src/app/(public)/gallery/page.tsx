import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ContactSheet from "@/components/gallery/ContactSheet";
import GalleryFilter from "@/components/gallery/GalleryFilter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Film photography prints and digital downloads. Landscape photography shot on medium format film — Pentax 67, Mamiya, Hasselblad.",
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ collection?: string }>;
}

async function getPhotos(collection?: string) {
  return prisma.photo.findMany({
    where: collection ? { collectionTag: collection } : undefined,
    orderBy: [{ featured: "desc" }, { captureDate: "desc" }],
  });
}

async function getCollections() {
  const photos = await prisma.photo.findMany({ select: { collectionTag: true } });
  const tags = new Set(photos.map((p) => p.collectionTag).filter(Boolean) as string[]);
  return Array.from(tags).sort();
}

export default async function GalleryPage({ searchParams }: Props) {
  const { collection } = await searchParams;
  const [photos, collections] = await Promise.all([
    getPhotos(collection),
    getCollections(),
  ]);

  const total = await prisma.photo.count();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="font-meta text-muted-foreground mb-3">
          {frameRange(total)} · Film Photography
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Gallery.</h1>
        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
          All prints are digital downloads — full-resolution scans delivered as a secure download link.
          Personal use only; see the{" "}
          <a href="/license" className="underline underline-offset-2 hover:text-ink transition-colors">
            photo license
          </a>{" "}
          for details.
        </p>
      </div>

      {/* Filters */}
      {collections.length > 0 && (
        <div className="mb-8">
          <Suspense>
            <GalleryFilter collections={collections} activeCollection={collection ?? null} />
          </Suspense>
        </div>
      )}

      {/* Contact sheet grid */}
      {photos.length === 0 ? (
        <p className="font-meta text-muted-foreground py-16 text-center">
          No photos found{collection ? ` in "${collection}"` : ""}.
        </p>
      ) : (
        <>
          <div className="border border-border">
            <ContactSheet photos={photos} />
          </div>
          {/* Frame counter pagination label */}
          <p className="font-meta text-muted-foreground mt-3 text-right">
            {frameRange(photos.length)}
            {collection ? ` · ${collection}` : " · All collections"}
          </p>
        </>
      )}
    </div>
  );
}

function frameRange(count: number) {
  if (count === 0) return "00A / 00A";
  return `01A / ${String(count).padStart(2, "0")}A`;
}
