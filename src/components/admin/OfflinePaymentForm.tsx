"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const METHODS = ["Venmo", "Cash", "Check", "Zelle", "Other"];

const inputClass =
  "w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30";

export function OfflinePaymentForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) { setPreviewUrl(null); return; }
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("uploading");
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("bookingId", bookingId);

    try {
      const res = await fetch("/api/admin/offline-payment", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong.");
        setStatus("error");
      } else {
        form.reset();
        setPreviewUrl(null);
        setStatus("idle");
        router.refresh();
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1">Amount (USD) *</label>
          <input name="amount" type="number" step="0.01" min="0.01" required className={inputClass} placeholder="0.00" />
        </div>
        <div>
          <label className="font-meta text-xs text-muted-foreground block mb-1">Method *</label>
          <select name="method" required className={inputClass}>
            <option value="">Select…</option>
            {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Note (optional)</label>
        <input name="note" type="text" className={inputClass} placeholder="e.g. Deposit paid in full" />
      </div>

      <div>
        <label className="font-meta text-xs text-muted-foreground block mb-1">Proof of payment (screenshot/photo) *</label>
        <input
          ref={fileRef}
          name="proof"
          type="file"
          accept="image/*,.pdf"
          required
          onChange={handleFileChange}
          className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-border file:text-xs file:font-meta file:bg-cream file:text-ink hover:file:opacity-70 file:cursor-pointer"
        />
        {previewUrl && (
          <img src={previewUrl} alt="Proof preview" className="mt-2 max-h-40 rounded-sm border border-border object-contain" />
        )}
      </div>

      {status === "error" && <p className="text-sm text-rose">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "uploading"}
        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity disabled:opacity-50 font-meta"
      >
        {status === "uploading" ? "Uploading…" : "Record payment"}
      </button>
    </form>
  );
}
