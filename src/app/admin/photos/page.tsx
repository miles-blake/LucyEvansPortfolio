import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { deletePhoto } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Photos" };
export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Photos</h1>
        <Link
          href="/admin/photos/new"
          className="bg-ink text-cream text-sm px-4 py-2 rounded-sm hover:opacity-80 transition-opacity"
        >
          + New photo
        </Link>
      </div>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Title</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Collection</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Price</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {photos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No photos yet.
                </td>
              </tr>
            )}
            {photos.map((photo) => (
              <tr key={photo.id} className="hover:bg-ink/5">
                <td className="px-4 py-3 text-ink">{photo.title}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {photo.collectionTag ?? "—"}
                </td>
                <td className="px-4 py-3 font-meta text-muted-foreground hidden md:table-cell">
                  ${(photo.price / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3">
                  {photo.featured ? (
                    <span className="font-meta text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-sm">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 justify-end">
                    <Link
                      href={`/admin/photos/${photo.id}/edit`}
                      className="text-xs text-muted-foreground hover:text-ink"
                    >
                      Edit
                    </Link>
                    <form action={deletePhoto}>
                      <input type="hidden" name="id" value={photo.id} />
                      <button
                        type="submit"
                        className="text-xs text-rose hover:opacity-70"
                        onClick={(e) => {
                          if (!confirm(`Delete "${photo.title}"?`)) e.preventDefault();
                        }}
                      >
                        Delete
                      </button>
                    </form>
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
