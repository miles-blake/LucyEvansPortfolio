import { prisma } from "@/lib/prisma";
import { createBundle } from "../actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — New Bundle" };
export const dynamic = "force-dynamic";

export default async function NewBundlePage() {
  const photos = await prisma.photo.findMany({ orderBy: { title: "asc" } });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/bundles" className="text-sm text-muted-foreground hover:text-ink">← Bundles</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">New bundle</h1>
      </div>
      <BundleForm action={createBundle} photos={photos} submitLabel="Create bundle" />
    </div>
  );
}

function BundleForm({
  action,
  photos,
  submitLabel,
  bundle,
  selectedPhotoIds = [],
}: {
  action: (formData: FormData) => Promise<void>;
  photos: Array<{ id: string; title: string }>;
  submitLabel: string;
  bundle?: { id: string; title: string; slug: string; description: string | null; price: number; featured: boolean };
  selectedPhotoIds?: string[];
}) {
  const cls = "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

  return (
    <form action={action} className="space-y-5">
      {bundle && <input type="hidden" name="id" value={bundle.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Title *</label>
          <input type="text" name="title" defaultValue={bundle?.title} required className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Slug *</label>
          <input type="text" name="slug" defaultValue={bundle?.slug} required className={cls} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
        <textarea rows={3} name="description" defaultValue={bundle?.description ?? ""} className={`${cls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Price (USD) *</label>
        <input
          type="number"
          step="0.01"
          min="0"
          name="priceDisplay"
          defaultValue={bundle ? (bundle.price / 100).toFixed(2) : ""}
          required
          className={cls}
        />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-2">Photos (select all that apply)</label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-sm p-3">
          {photos.map((photo) => (
            <label key={photo.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                name="photo_check"
                value={photo.id}
                defaultChecked={selectedPhotoIds.includes(photo.id)}
                className="w-4 h-4 accent-ink"
              />
              <span className="text-ink">{photo.title}</span>
              <span className="font-meta text-xs text-muted-foreground">{photo.id}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Photo IDs (auto-populated):</p>
        <input
          type="text"
          name="photoIds"
          defaultValue={selectedPhotoIds.join(", ")}
          placeholder="Photo IDs, comma-separated"
          className={`${cls} mt-1`}
        />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-ink">
        <input type="checkbox" name="featured" defaultChecked={bundle?.featured} className="w-4 h-4 accent-ink" />
        Featured
      </label>

      <button type="submit" className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity">
        {submitLabel}
      </button>
    </form>
  );
}

export { BundleForm };
