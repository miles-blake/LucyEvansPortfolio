import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { approveReview, unapproveReview, deleteReview } from "./actions";

export const metadata: Metadata = { title: "Admin — Reviews" };
export const dynamic = "force-dynamic";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 text-sm">
      {"★".repeat(rating)}
      <span className="text-muted-foreground/30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { rating: { gt: 0 } },
    orderBy: { createdAt: "desc" },
  });

  const pending = reviews.filter((r) => !r.approved);
  const approved = reviews.filter((r) => r.approved);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-ink mb-8">Reviews</h1>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="font-display text-lg text-ink mb-4">
            Pending approval
            <span className="ml-2 font-meta text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-sm">{pending.length}</span>
          </h2>
          <div className="space-y-4">
            {pending.map((r) => (
              <div key={r.id} className="border border-border rounded-sm p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-ink font-medium">{r.clientName}</p>
                    <p className="font-meta text-xs text-muted-foreground">{r.clientEmail}</p>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.body}</p>
                <p className="font-meta text-xs text-muted-foreground">
                  {r.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <form action={approveReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta">
                      Approve &amp; publish
                    </button>
                  </form>
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs text-rose hover:opacity-70 transition-opacity font-meta">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-lg text-ink mb-4">Published ({approved.length})</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground">No published reviews yet.</p>
        ) : (
          <div className="space-y-4">
            {approved.map((r) => (
              <div key={r.id} className="border border-border rounded-sm p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-ink font-medium">{r.clientName}</p>
                    <p className="font-meta text-xs text-muted-foreground">{r.clientEmail}</p>
                  </div>
                  <Stars rating={r.rating} />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{r.body}</p>
                <div className="flex items-center gap-3 pt-1">
                  <form action={unapproveReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs text-muted-foreground hover:text-ink transition-colors font-meta">
                      Unpublish
                    </button>
                  </form>
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-xs text-rose hover:opacity-70 transition-opacity font-meta">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviews.length === 0 && (
        <p className="text-sm text-muted-foreground">No reviews received yet. Review requests are sent automatically when a booking is marked Completed.</p>
      )}
    </div>
  );
}
