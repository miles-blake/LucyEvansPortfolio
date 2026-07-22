"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  bookingId: string;
}

export function GenerateContractButton({ bookingId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noTemplate, setNoTemplate] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError(null);
    setNoTemplate(false);

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/generate-contract`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.error === "No contract template saved yet.") {
          setNoTemplate(true);
        } else {
          setError(data?.error ?? "Something went wrong.");
        }
        return;
      }

      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta disabled:opacity-40"
      >
        {loading ? "Generating…" : "Generate contract"}
      </button>

      {noTemplate && (
        <p className="font-meta text-xs text-muted-foreground">
          No contract template found.{" "}
          <Link href="/admin/contract-template" className="text-ink underline underline-offset-2 hover:opacity-70">
            Set up a template →
          </Link>
        </p>
      )}

      {error && (
        <p className="font-meta text-xs text-rose-500">{error}</p>
      )}
    </div>
  );
}
