import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Mini Sessions" };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function MiniSessionsPage() {
  const days = await prisma.miniSessionDay.findMany({
    include: { slots: { select: { status: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">Mini sessions</h1>
          <p className="font-meta text-xs text-muted-foreground mt-1">
            Time-slot booking days — clients each pick one slot independently.
          </p>
        </div>
        <Link
          href="/admin/mini-sessions/new"
          className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta"
        >
          + New day
        </Link>
      </div>

      {days.length === 0 ? (
        <div className="border border-border rounded-sm p-8 text-center">
          <p className="font-display text-lg text-ink mb-2">No mini session days yet</p>
          <p className="font-meta text-sm text-muted-foreground mb-4">
            Create a day with time slots that clients can book individually.
          </p>
          <Link
            href="/admin/mini-sessions/new"
            className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta inline-block"
          >
            + Create your first day
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {days.map((day) => {
            const booked = day.slots.filter((s) => s.status === "booked").length;
            const total = day.slots.length;
            return (
              <li key={day.id}>
                <Link
                  href={`/admin/mini-sessions/${day.id}`}
                  className="block border border-border rounded-sm p-4 hover:border-ink/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-ink">{day.title}</p>
                      <p className="font-meta text-xs text-muted-foreground mt-0.5">
                        {formatDate(day.date)} · {formatPrice(day.price)}/slot · {day.duration} min
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-meta text-xs text-muted-foreground">
                        {booked}/{total} booked
                      </span>
                      <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                        day.isPublished ? "bg-sage/20 text-sage" : "bg-ink/10 text-muted-foreground"
                      }`}>
                        {day.isPublished ? "published" : "draft"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
