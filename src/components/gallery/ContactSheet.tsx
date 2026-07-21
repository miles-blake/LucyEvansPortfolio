"use client";
import Image from "next/image";
import Link from "next/link";
import { SaveButton } from "./SaveButton";

type Photo = {
  id: string;
  slug: string;
  title: string;
  previewImageUrl: string;
  filmStock: string | null;
  isLimitedEdition: boolean;
  editionSize: number | null;
  featured: boolean;
  price: number;
};

// Frame counter pagination style: 01A, 02A … like a contact sheet
function frameLabel(index: number) {
  return `${String(index + 1).padStart(2, "0")}A`;
}

export default function ContactSheet({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
      {photos.map((photo, i) => (
        <div key={photo.id} className="relative bg-cream overflow-hidden">
          {/* Image link */}
          <Link
            href={`/gallery/${photo.slug}`}
            className="group block focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-0"
          >
            {/* Image */}
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
              <Image
                src={photo.previewImageUrl}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-300" />

              {/* Limited edition badge */}
              {photo.isLimitedEdition && (
                <span className="absolute top-2 left-2 font-meta text-cream bg-ink/80 px-1.5 py-0.5 text-[10px]">
                  ED. {photo.editionSize}
                </span>
              )}

              {/* Featured dot */}
              {photo.featured && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-sky" aria-label="Featured" />
              )}
            </div>
          </Link>

          {/* Contact-sheet annotation strip */}
          <div className="px-2 py-1.5 flex items-start justify-between gap-2 bg-cream border-t border-border">
            <div className="min-w-0">
              <p className="font-meta text-ink text-[10px] truncate">{photo.title}</p>
              {photo.filmStock && (
                <p className="font-meta text-muted-foreground text-[10px] truncate">{photo.filmStock}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <SaveButton
                item={{
                  id: photo.id,
                  slug: photo.slug,
                  title: photo.title,
                  previewImageUrl: photo.previewImageUrl,
                  price: photo.price,
                }}
              />
              <span className="font-meta text-muted-foreground text-[10px]">
                {frameLabel(i)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
