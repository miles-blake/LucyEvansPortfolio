import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Subscribers" };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminSubscribersPage() {
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { subscribedAt: "desc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Subscribers</h1>
        <Link
          href="/api/admin/subscribers/export"
          className="text-sm border border-border text-ink px-3 py-1.5 rounded-sm hover:border-sky/40 transition-colors"
        >
          Export CSV
        </Link>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{subscribers.length} total</p>

      <div className="border border-border rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Email</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Source</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Confirmed</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {subscribers.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No subscribers yet.</td></tr>
            )}
            {subscribers.map((s) => (
              <tr key={s.id} className="hover:bg-ink/5">
                <td className="px-4 py-3 text-ink">{s.email}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.source ?? "—"}</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {s.confirmed ? (
                    <span className="font-meta text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-sm">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-meta text-xs text-muted-foreground">{formatDate(s.subscribedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
