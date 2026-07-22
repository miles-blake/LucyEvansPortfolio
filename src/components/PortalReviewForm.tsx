"use client";

import { useState } from "react";

interface Props {
  reviewToken: string;
  alreadySubmitted: boolean;
}

export function PortalReviewForm({ reviewToken, alreadySubmitted }: Props) {
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (submitted) {
    return (
      <p className="font-meta text-sm text-muted-foreground">
        Thanks — your review has been submitted!
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!body.trim()) { setError("Please write a short review."); return; }
    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/reviews/${reviewToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body }),
    });
    if (res.ok) {
      setSubmitted(true);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Star rating */}
      <div>
        <label className="block font-meta text-xs text-muted-foreground mb-2">Rating</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-2xl leading-none transition-colors focus:outline-none"
              aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            >
              <span className={(hovered || rating) >= star ? "text-amber-400" : "text-muted-foreground/30"}>
                ★
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div>
        <label className="block font-meta text-xs text-muted-foreground mb-1.5">Your review</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Tell us about your experience…"
          className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm resize-none"
        />
      </div>

      {error && <p className="text-rose text-sm">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="bg-ink text-cream px-4 py-2 rounded-sm font-meta text-xs hover:opacity-80 transition-opacity disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
