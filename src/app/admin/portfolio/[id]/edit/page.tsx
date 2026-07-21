import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { updatePortfolioPiece } from "../../actions";
import { PortfolioForm } from "../../new/page";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Edit Portfolio Piece" };
export const dynamic = "force-dynamic";

export default async function EditPortfolioPiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piece = await prisma.portfolioPiece.findUnique({ where: { id } });
  if (!piece) notFound();

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/portfolio" className="text-sm text-muted-foreground hover:text-ink">← Portfolio</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">Edit: {piece.title}</h1>
      </div>
      <PortfolioForm action={updatePortfolioPiece} piece={piece} submitLabel="Save changes" />
    </div>
  );
}
