import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deleteBundle } from "./actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Bundles" };
export const dynamic = "force-dynamic";

export default async function AdminBundlesPage() {
  const bundles = await prisma.bundle.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: true },
  });

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Bundles</h1>
        <Link href="/admin/bundles/new" className="bg-ink text-cream text-sm px-4 py-2 rounded-sm hover:opacity-80 transition-opacity">
          + New bundle
        </Link>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Title</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Photos</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Price</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bundles.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No bundles yet.</td></tr>
            )}
            {bundles.map((b) => (
              <tr key={b.id} className="relative hover:bg-ink/5 cursor-pointer">
                <td className="px-4 py-3 text-ink">
                  <Link href={`/admin/bundles/${b.id}/edit`} className="absolute inset-0 z-0" aria-label={`Edit ${b.title}`} />
                  {b.title}
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{b.photos.length}</td>
                <td className="px-4 py-3 font-meta text-muted-foreground hidden md:table-cell">${(b.price / 100).toFixed(0)}</td>
                <td className="px-4 py-3">
                  <div className="relative z-10 flex items-center gap-3 justify-end">
                    <Link href={`/admin/bundles/${b.id}/edit`} className="text-xs text-muted-foreground hover:text-ink">Edit</Link>
                    <DeleteButton action={deleteBundle} id={b.id} label={b.title} />
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
