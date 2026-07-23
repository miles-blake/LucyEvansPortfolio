import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Client Reviews — Lucy Evans Photography",
  description: "Read what clients say about their experience working with Lucy Evans Photography.",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`}>
      <span className="text-amber-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground/20">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export default async function ReviewsPage() {
  const reviews = await prisma.review.findMany({
    where: { approved: true, rating: { gt: 0 } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <div className="mb-12">
        <p className="font-meta text-muted-foreground mb-3">Client reviews</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mb-4">What clients say</h1>
        {reviews.length > 0 && (
          <p className="text-muted-foreground">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            {" · "}
            {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)} average
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">Reviews coming soon.</p>
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => (
            <article key={review.id} className="border-b border-border pb-8 last:border-0 last:pb-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-display text-ink">{review.clientName}</p>
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">
                    {review.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                </div>
                <Stars rating={review.rating} />
              </div>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{review.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
