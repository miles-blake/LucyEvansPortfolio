export const dynamic = "force-dynamic";

import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bundles",
  description: "Curated collections of film photography prints — buy multiple images together at a reduced price.",
};

export const revalidate = 3600;

export default async function BundlesPage() {
  const bundles = await prisma.bundle.findMany({
    include: { photos: { include: { photo: true }, take: 4 } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-12">
        <p className="font-meta text-muted-foreground mb-3">Curated sets</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Bundles.</h1>
        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
          Thematically grouped prints at a reduced combined price. Each bundle includes full-resolution downloads of all included photos.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {bundles.map((bundle) => {
          const photos = bundle.photos.map((bp) => bp.photo);
          const savings = photos.reduce((s, p) => s + p.price, 0) - bundle.price;

          return (
            <Link
              key={bundle.id}
              href={`/bundles/${bundle.slug}`}
              className="group block border border-border rounded-sm overflow-hidden hover:border-sky/50 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
            >
              {/* Preview grid of up to 4 photos */}
              <div className="grid grid-cols-2 gap-px bg-border">
                {photos.slice(0, 4).map((photo) => (
                  <div key={photo.id} className="relative aspect-[4/3] bg-muted overflow-hidden">
                    <Image
                      src={photo.previewImageUrl}
                      alt={photo.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                ))}
                {/* Fill empty slots */}
                {Array.from({ length: Math.max(0, 4 - photos.length) }).map((_, i) => (
                  <div key={i} className="aspect-[4/3] bg-muted" />
                ))}
              </div>

              <div className="p-6">
                <h2 className="font-display text-2xl text-ink mb-2 group-hover:opacity-80 transition-opacity">
                  {bundle.title}
                </h2>
                {bundle.description && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-2">
                    {bundle.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-display text-2xl text-ink">
                      ${(bundle.price / 100).toFixed(0)}
                    </span>
                    {savings > 0 && (
                      <span className="font-meta text-sky ml-3 text-sm">
                        Save ${(savings / 100).toFixed(0)}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground group-hover:text-ink group-hover:gap-2 transition-all">
                    {photos.length} prints <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
