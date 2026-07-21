"use client";

import { useState } from "react";

interface PayButtonProps {
  label: string;
  type: "deposit" | "invoice";
  bookingId?: string;
  invoiceId?: string;
  portalToken?: string;
  className?: string;
}

export function PayButton({
  label,
  type,
  bookingId,
  invoiceId,
  portalToken,
  className,
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, bookingId, invoiceId, portalToken }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`font-meta text-xs bg-ink text-cream px-4 py-2 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50 ${className ?? ""}`}
      >
        {loading ? "Redirecting to checkout…" : label}
      </button>
      {error && <p className="text-rose-600 text-xs mt-2">{error}</p>}
    </div>
  );
}
