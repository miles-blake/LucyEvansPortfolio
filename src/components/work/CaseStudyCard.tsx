import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
type PortfolioPiece = {
  id: string;
  slug: string;
  title: string;
  brandName: string;
  coverImageUrl: string | null;
  videoUrls: string[];
  role: string | null;
  metrics: string | null;
  tags: string[];
};

export default function CaseStudyCard({ piece }: { piece: PortfolioPiece }) {
  return (
    <Link
      href={`/work/${piece.slug}`}
      className="group block bg-cream border border-border rounded-sm overflow-hidden hover:border-rose/50 transition-colors focus-visible:outline-2 focus-visible:outline-ring"
    >
      {/* Cover image */}
      <div className="relative aspect-video bg-blush/20 overflow-hidden">
        {piece.coverImageUrl ? (
          <Image
            src={piece.coverImageUrl}
            alt={piece.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blush to-rose/30" />
        )}
        {/* Video indicator */}
        {piece.videoUrls.length > 0 && (
          <span className="absolute bottom-3 right-3 font-meta text-cream bg-ink/70 px-2 py-0.5 backdrop-blur-sm">
            {piece.videoUrls.length} video{piece.videoUrls.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-6">
        <p className="font-meta text-rose mb-2">{piece.brandName}</p>
        <h3 className="font-display text-xl text-ink mb-2 group-hover:opacity-80 transition-opacity leading-snug">
          {piece.title}
        </h3>
        {piece.role && (
          <p className="font-meta text-muted-foreground mb-3">{piece.role}</p>
        )}
        {piece.metrics && (
          <p className="text-sm text-ink border-l-2 border-rose pl-3 mb-4 leading-relaxed">
            {piece.metrics}
          </p>
        )}

        {/* Tags */}
        {piece.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {piece.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="font-meta text-muted-foreground border border-border px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <span className="inline-flex items-center gap-1 text-sm text-ink group-hover:gap-2 transition-all">
          View case study <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
