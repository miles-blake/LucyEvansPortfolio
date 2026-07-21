import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deletePortfolioPiece } from "./actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Portfolio" };
export const dynamic = "force-dynamic";

export default async function AdminPortfolioPage() {
  const pieces = await prisma.portfolioPiece.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Portfolio pieces</h1>
        <Link href="/admin/portfolio/new" className="bg-ink text-cream text-sm px-4 py-2 rounded-sm hover:opacity-80 transition-opacity">
          + New piece
        </Link>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Title</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Brand</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pieces.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No portfolio pieces yet.</td></tr>
            )}
            {pieces.map((p) => (
              <tr key={p.id} className="relative hover:bg-ink/5 cursor-pointer">
                <td className="px-4 py-3 text-ink">
                  <Link href={`/admin/portfolio/${p.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${p.title}`} />
                  {p.title}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.brandName}</td>
                <td className="px-4 py-3">
                  {p.featured ? (
                    <span className="font-meta text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-sm">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="relative z-10 flex items-center gap-3 justify-end">
                    <Link href={`/admin/portfolio/${p.id}/edit`} className="text-xs text-muted-foreground hover:text-ink">Edit</Link>
                    <DeleteButton action={deletePortfolioPiece} id={p.id} label={p.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
