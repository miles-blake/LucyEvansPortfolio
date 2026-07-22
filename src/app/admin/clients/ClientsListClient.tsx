"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientRow {
  id: string;
  email: string;
  emails: string[];
  name: string;
  phone?: string | null;
  hasAccount: boolean;
  emailVerified: boolean;
  bookingCount: number;
  paidOrderCount: number;
  totalSpent: number;
  lastActivity: string | null;
}

interface Props {
  clients: ClientRow[];
  duplicatePairs: [ClientRow, ClientRow][];
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function clientHref(c: ClientRow) {
  // Profile entries use the first email for routing; profile page will pick up via ClientProfile
  return `/admin/clients/${encodeURIComponent(c.emails[0] ?? c.email)}`;
}

function PairCard({
  pair,
  onDismiss,
}: {
  pair: [ClientRow, ClientRow];
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [a, b] = pair;

  const [merging, setMerging] = useState(false);
  const [canonicalName, setCanonicalName] = useState(() => {
    // Pre-select whichever has more records
    const aScore = a.bookingCount + a.paidOrderCount;
    const bScore = b.bookingCount + b.paidOrderCount;
    return aScore >= bScore ? a.name : b.name;
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmMerge() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailA: a.email, emailB: b.email, canonicalName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Merge failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="border border-border rounded-sm p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {([a, b] as ClientRow[]).map((c, idx) => (
          <div key={idx} className="space-y-1">
            <p className="font-display text-sm text-ink">{c.name}</p>
            <div className="space-y-0.5">
              {c.emails.map((e) => (
                <p key={e} className="font-meta text-xs text-muted-foreground">{e}</p>
              ))}
            </div>
            {c.phone && (
              <p className="font-meta text-xs text-muted-foreground">{c.phone}</p>
            )}
            <p className="font-meta text-xs text-muted-foreground">
              {c.bookingCount} {c.bookingCount === 1 ? "booking" : "bookings"} ·{" "}
              {c.paidOrderCount} {c.paidOrderCount === 1 ? "order" : "orders"} ·{" "}
              {formatMoney(c.totalSpent)}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {!merging ? (
          <>
            <button
              onClick={() => setMerging(true)}
              className="font-meta text-xs border border-border rounded-sm px-3 py-1.5 hover:bg-ink/5 transition-colors text-ink"
            >
              Merge →
            </button>
            <button
              onClick={onDismiss}
              className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors"
            >
              Dismiss
            </button>
          </>
        ) : (
          <div className="space-y-3 w-full">
            <p className="font-meta text-xs text-ink">
              Merge these two clients? Choose the canonical name:
            </p>
            <div className="space-y-1">
              {[a.name, b.name].map((n) => (
                <label key={n} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`canonical-${a.email}-${b.email}`}
                    value={n}
                    checked={canonicalName === n}
                    onChange={() => setCanonicalName(n)}
                    className="accent-ink"
                  />
                  <span className="font-meta text-xs text-ink">{n}</span>
                </label>
              ))}
            </div>
            {error && (
              <p className="font-meta text-xs text-rose">{error}</p>
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={confirmMerge}
                disabled={pending}
                className="font-meta text-xs border border-border rounded-sm px-3 py-1.5 hover:bg-ink/5 transition-colors text-ink disabled:opacity-50"
              >
                {pending ? "Merging…" : "Confirm merge"}
              </button>
              <button
                onClick={() => { setMerging(false); setError(null); }}
                className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientsListClient({ clients, duplicatePairs }: Props) {
  const [query, setQuery] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());

  function pairKey(pair: [ClientRow, ClientRow]) {
    return [pair[0].email, pair[1].email].sort().join("|");
  }

  const visiblePairs = duplicatePairs.filter((p) => !dismissed.has(pairKey(p)));

  function dismiss(pair: [ClientRow, ClientRow]) {
    setDismissed((prev) => new Set([...prev, pairKey(pair)]));
  }

  const filtered = query.trim()
    ? clients.filter((c) => {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.emails.some((e) => e.toLowerCase().includes(q))
        );
      })
    : clients;

  return (
    <div className="space-y-4">
      {visiblePairs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-sm p-3 flex items-center justify-between gap-3">
          <p className="font-meta text-xs">
            {visiblePairs.length} possible duplicate {visiblePairs.length === 1 ? "client" : "clients"} found
          </p>
          <button
            onClick={() => setReviewOpen((o) => !o)}
            className="font-meta text-xs underline underline-offset-2 hover:no-underline shrink-0"
          >
            {reviewOpen ? "Close" : "Review →"}
          </button>
        </div>
      )}

      {reviewOpen && visiblePairs.length > 0 && (
        <div className="border border-border rounded-sm p-4 mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm text-ink">Possible duplicates</p>
            <button
              onClick={() => setReviewOpen(false)}
              className="font-meta text-xs text-muted-foreground hover:text-ink transition-colors"
              aria-label="Close review panel"
            >
              ✕ close
            </button>
          </div>
          {visiblePairs.map((pair) => (
            <PairCard
              key={pairKey(pair)}
              pair={pair}
              onDismiss={() => dismiss(pair)}
            />
          ))}
        </div>
      )}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name or email…"
        className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40"
      />

      <p className="font-meta text-xs text-muted-foreground">
        {filtered.length} {filtered.length === 1 ? "client" : "clients"}
      </p>

      {clients.length === 0 && (
        <p className="text-sm text-muted-foreground">No clients yet.</p>
      )}

      {clients.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-muted-foreground">No clients match your search.</p>
      )}

      <div className="space-y-2">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={clientHref(c)}
            className="flex items-center gap-4 border border-border rounded-sm px-4 py-3 hover:bg-ink/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-ink truncate">{c.name}</p>
              <p className="font-meta text-xs text-muted-foreground truncate">
                {c.emails[0]}
                {c.emails.length > 1 && (
                  <span className="ml-1 text-muted-foreground/70">+{c.emails.length - 1} more</span>
                )}
              </p>
            </div>

            <div className="hidden sm:flex flex-col items-end gap-0.5 text-right shrink-0">
              {c.bookingCount > 0 && (
                <p className="font-meta text-xs text-muted-foreground">
                  {c.bookingCount} {c.bookingCount === 1 ? "booking" : "bookings"}
                </p>
              )}
              {c.paidOrderCount > 0 && (
                <p className="font-meta text-xs text-muted-foreground">
                  {c.paidOrderCount} {c.paidOrderCount === 1 ? "order" : "orders"}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-0.5 text-right shrink-0">
              <p className="font-display text-sm text-ink">{formatMoney(c.totalSpent)}</p>
              <p className="font-meta text-xs text-muted-foreground">
                {c.lastActivity ? formatShortDate(c.lastActivity) : "no activity"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
