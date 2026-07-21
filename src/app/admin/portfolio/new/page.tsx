import { createPortfolioPiece } from "../actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — New Portfolio Piece" };

const cls = "w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm";

type Piece = {
  id: string;
  title: string;
  slug: string;
  brandName: string;
  role: string | null;
  description: string | null;
  deliverables: string | null;
  metrics: string | null;
  videoUrls: string[];
  originalPostUrls: string[];
  coverImageUrl: string | null;
  tags: string[];
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  featured: boolean;
};

export function PortfolioForm({
  action,
  submitLabel,
  piece,
}: {
  action: (fd: FormData) => Promise<void>;
  submitLabel: string;
  piece?: Piece;
}) {
  return (
    <form action={action} className="space-y-5">
      {piece && <input type="hidden" name="id" value={piece.id} />}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Title *</label>
          <input type="text" name="title" defaultValue={piece?.title} required className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Slug *</label>
          <input type="text" name="slug" defaultValue={piece?.slug} required className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Brand name *</label>
          <input type="text" name="brandName" defaultValue={piece?.brandName} required className={cls} />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Role</label>
          <input type="text" name="role" defaultValue={piece?.role ?? ""} className={cls} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Description</label>
        <textarea rows={3} name="description" defaultValue={piece?.description ?? ""} className={`${cls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Deliverables</label>
        <textarea rows={2} name="deliverables" defaultValue={piece?.deliverables ?? ""} className={`${cls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Metrics</label>
        <textarea rows={2} name="metrics" defaultValue={piece?.metrics ?? ""} className={`${cls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Video URLs (one per line)</label>
        <textarea rows={3} name="videoUrls" defaultValue={piece?.videoUrls.join("\n") ?? ""} className={`${cls} resize-none font-meta text-xs`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Original post URLs (one per line)</label>
        <textarea rows={3} name="originalPostUrls" defaultValue={piece?.originalPostUrls.join("\n") ?? ""} className={`${cls} resize-none font-meta text-xs`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Cover image URL</label>
        <input type="text" name="coverImageUrl" defaultValue={piece?.coverImageUrl ?? ""} className={cls} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Tags (one per line)</label>
        <textarea rows={3} name="tags" defaultValue={piece?.tags.join("\n") ?? ""} className={`${cls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Testimonial quote</label>
        <textarea rows={2} name="testimonialQuote" defaultValue={piece?.testimonialQuote ?? ""} className={`${cls} resize-none`} />
      </div>

      <div>
        <label className="block text-sm text-muted-foreground mb-1.5">Testimonial author</label>
        <input type="text" name="testimonialAuthor" defaultValue={piece?.testimonialAuthor ?? ""} className={cls} />
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer text-sm text-ink">
        <input type="checkbox" name="featured" defaultChecked={piece?.featured} className="w-4 h-4 accent-ink" />
        Featured
      </label>

      <button type="submit" className="bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity">
        {submitLabel}
      </button>
    </form>
  );
}

export default function NewPortfolioPiecePage() {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/portfolio" className="text-sm text-muted-foreground hover:text-ink">← Portfolio</Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-display text-xl text-ink">New piece</h1>
      </div>
      <PortfolioForm action={createPortfolioPiece} submitLabel="Create piece" />
    </div>
  );
}
