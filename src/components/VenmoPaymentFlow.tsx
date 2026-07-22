"use client";

import { useState, useRef } from "react";

interface Props {
  bookingId: string;
  portalToken: string;
  amount: number;       // cents
  type: "deposit" | "invoice";
  customerName: string;
}

export function VenmoPaymentFlow({ bookingId, portalToken, amount, type, customerName }: Props) {
  const [step, setStep] = useState<"instructions" | "uploading" | "done">("instructions");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const dollars = (amount / 100).toFixed(2);
  const venmoNote = encodeURIComponent(`${type === "deposit" ? "Deposit" : "Payment"} - Lucy Evans Photography`);
  const venmoUrl = `https://venmo.com/Lucy-Evans99?txn=pay&amount=${dollars}&note=${venmoNote}`;
  const venmoAppUrl = `venmo://paycharge?txn=pay&recipients=Lucy-Evans99&amount=${dollars}&note=${venmoNote}`;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPreview(null); return; }
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please attach your payment screenshot."); return; }

    setSubmitting(true);
    setError("");

    const fd = new FormData();
    fd.set("bookingId", bookingId);
    fd.set("portalToken", portalToken);
    fd.set("amount", String(amount));
    fd.set("type", type);
    fd.set("proof", file);

    try {
      const res = await fetch("/api/venmo-payment", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setSubmitting(false);
      } else {
        setStep("done");
      }
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  if (step === "done") {
    return (
      <div className="mt-4 p-4 bg-sage/10 border border-sage/30 rounded-sm text-sm text-ink">
        <p className="font-medium mb-1">Payment submitted — thank you!</p>
        <p className="text-muted-foreground">
          Lucy will verify your payment and confirm within 24 hours. You&apos;ll receive an email once it&apos;s confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Step 1 — Send payment */}
      <div className="border border-border rounded-sm p-4">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-wide mb-3">Step 1 — Send payment on Venmo</p>
        <div className="space-y-2 text-sm text-ink mb-4">
          <p>Send <span className="font-medium">${dollars}</span> to <span className="font-medium">@Lucy-Evans99</span></p>
          <p className="font-meta text-xs text-muted-foreground">
            In the note field write: <span className="italic">&ldquo;{type === "deposit" ? "Deposit" : "Payment"} - {customerName}&rdquo;</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={venmoAppUrl}
            onClick={(e) => {
              // Fallback to web if app not installed
              setTimeout(() => { window.location.href = venmoUrl; }, 500);
            }}
            className="inline-flex items-center gap-2 bg-[#008CFF] text-white text-sm font-medium px-4 py-2 rounded-sm hover:opacity-90 transition-opacity"
          >
            Open Venmo app →
          </a>
          <a
            href={venmoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-border text-muted-foreground text-sm px-4 py-2 rounded-sm hover:text-ink transition-colors"
          >
            Open in browser →
          </a>
        </div>
      </div>

      {/* Step 2 — Upload screenshot */}
      <div className="border border-border rounded-sm p-4">
        <p className="font-meta text-xs text-muted-foreground uppercase tracking-wide mb-3">Step 2 — Upload your payment screenshot</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-border file:text-xs file:font-meta file:bg-cream file:text-ink hover:file:opacity-70 file:cursor-pointer"
            />
            <p className="font-meta text-xs text-muted-foreground mt-1">
              Take a screenshot of your Venmo confirmation and attach it here.
            </p>
          </div>
          {preview && (
            <img src={preview} alt="Payment proof" className="max-h-48 rounded-sm border border-border object-contain" />
          )}
          {error && <p className="text-sm text-rose">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-ink text-cream text-sm px-4 py-2 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit payment proof"}
          </button>
        </form>
      </div>
    </div>
  );
}
