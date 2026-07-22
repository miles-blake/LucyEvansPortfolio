"use client";

import Link from "next/link";
import { useState } from "react";

interface ClientRow {
  email: string;
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
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export function ClientsListClient({ clients }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? clients.filter((c) => {
        const q = query.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      })
    : clients;

  return (
    <div className="space-y-4">
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
            key={c.email}
            href={`/admin/clients/${encodeURIComponent(c.email)}`}
            className="flex items-center gap-4 border border-border rounded-sm px-4 py-3 hover:bg-ink/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm text-ink truncate">{c.name}</p>
              <p className="font-meta text-xs text-muted-foreground truncate">{c.email}</p>
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
