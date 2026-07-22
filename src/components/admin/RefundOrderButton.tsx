"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  orderId: string;
  amount: number; // cents
}

export function RefundOrderButton({ orderId, amount }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRefund() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/refund`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong.");
        setConfirming(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setConfirming(true)}
          className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-rose hover:border-rose transition-colors"
        >
          Refund ${(amount / 100).toFixed(2)} →
        </button>
        {error && <p className="font-meta text-xs text-rose">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="font-meta text-xs text-ink">
        Refund <strong>${(amount / 100).toFixed(2)}</strong> to the original payment method?
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={handleRefund}
          disabled={loading}
          className="bg-rose text-white px-3 py-1.5 rounded-sm text-xs font-meta hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {loading ? "Refunding…" : "Yes, refund"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
      {error && <p className="font-meta text-xs text-rose">{error}</p>}
    </div>
  );
}
