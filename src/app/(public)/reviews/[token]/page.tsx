"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

type Status = "loading" | "ready" | "submitting" | "submitted" | "invalid";

export default function ReviewPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("loading");
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setClientName(data.clientName ?? "");
          setStatus(data.alreadySubmitted ? "submitted" : "ready");
        } else {
          setStatus("invalid");
        }
      })
      .catch(() => setStatus("invalid"));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError("Please select a star rating."); return; }
    if (!body.trim()) { setError("Please write a short review."); return; }
    setError(null);
    setStatus("submitting");
    const res = await fetch(`/api/reviews/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, body }),
    });
    if (res.ok) {
      setStatus("submitted");
    } else {
      const json = await res.json();
      setError(json.error ?? "Something went wrong.");
      setStatus("ready");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl text-ink">Link not found</h1>
          <p className="text-sm text-muted-foreground">This review link may have already been used or is invalid.</p>
        </div>
      </div>
    );
  }

  if (status === "submitted") {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="font-display text-2xl text-ink">Thank you!</h1>
          <p className="text-sm text-muted-foreground">Your review has been received. It means so much — thank you for taking the time.</p>
        </div>
      </div>
    );
  }

  const firstName = clientName.split(" ")[0];

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <p className="font-meta text-sm text-muted-foreground mb-2">Lucy Evans Photography</p>
          <h1 className="font-display text-3xl text-ink">How was your experience{firstName ? `, ${firstName}` : ""}?</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Your review helps other clients feel confident booking, and it means the world to a small business.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star rating */}
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl leading-none transition-colors focus:outline-none"
                  aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                >
                  <span className={(hovered || rating) >= star ? "text-amber-400" : "text-muted-foreground/30"}>
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Review body */}
          <div>
            <label className="block text-sm text-muted-foreground mb-1.5">Your review</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              placeholder="Tell us about your experience — what made it special, what you loved about working with Lucy…"
              className="w-full border border-border rounded-sm px-3 py-2 text-ink bg-cream focus:outline-none focus:ring-2 focus:ring-sky/40 text-sm resize-none"
            />
          </div>

          {error && <p className="text-rose text-sm">{error}</p>}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-ink text-cream py-3 rounded-sm font-display text-sm hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting…" : "Submit review"}
          </button>
        </form>
      </div>
    </div>
  );
}
