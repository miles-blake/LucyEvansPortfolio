export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import CaseStudyCard from "@/components/work/CaseStudyCard";
import PortfolioFilter from "@/components/work/PortfolioFilter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Short-form brand content for TikTok and Instagram Reels. Case studies with metrics, deliverables, and client testimonials.",
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

async function getPieces(tag?: string) {
  return prisma.portfolioPiece.findMany({
    where: tag ? { tags: { has: tag } } : undefined,
    orderBy: [{ featured: "desc" }, { dateCompleted: "desc" }],
  });
}

async function getAllTags() {
  const pieces = await prisma.portfolioPiece.findMany({ select: { tags: true } });
  const tagSet = new Set(pieces.flatMap((p) => p.tags));
  return Array.from(tagSet).sort();
}

export default async function WorkPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  const [pieces, allTags] = await Promise.all([getPieces(tag), getAllTags()]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="mb-12">
        <p className="font-meta text-muted-foreground mb-3">Content Marketing</p>
        <h1 className="font-display text-4xl md:text-5xl text-ink mb-4">Selected work.</h1>
        <p className="text-muted-foreground text-lg max-w-xl leading-relaxed">
          TikToks and Reels for brands that move product. Click any project for the full case study.
        </p>
      </div>

      {/* Filters */}
      {allTags.length > 0 && (
        <div className="mb-10">
          <Suspense>
            <PortfolioFilter allTags={allTags} activeTag={tag ?? null} />
          </Suspense>
        </div>
      )}

      {/* Grid */}
      {pieces.length === 0 ? (
        <p className="text-muted-foreground font-meta py-16 text-center">
          No case studies found{tag ? ` for "${tag}"` : ""}.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pieces.map((piece) => (
            <CaseStudyCard key={piece.id} piece={piece} />
          ))}
        </div>
      )}
    </div>
  );
}
