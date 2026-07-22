import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mini Sessions — Lucy Evans Photography" };

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function MiniSessionsPublicPage() {
  const now = new Date();
  const days = await prisma.miniSessionDay.findMany({
    where: { isPublished: true, date: { gte: now } },
    include: { slots: { select: { status: true } } },
    orderBy: { date: "asc" },
  });

  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-4xl text-ink mb-3">Mini sessions</h1>
      <p className="text-muted-foreground mb-10">
        Short, focused photo sessions — book a time slot that works for you.
      </p>

      {days.length === 0 ? (
        <div className="border border-border rounded-sm p-8 text-center">
          <p className="font-display text-lg text-ink mb-2">No upcoming mini sessions</p>
          <p className="font-meta text-sm text-muted-foreground">
            Check back soon, or{" "}
            <Link href="/contact" className="text-ink underline underline-offset-2 hover:opacity-70">
              get in touch
            </Link>{" "}
            to book a regular session.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const available = day.slots.filter((s) => s.status === "available").length;
            const total = day.slots.length;
            return (
              <Link
                key={day.id}
                href={`/mini-sessions/${day.id}`}
                className="block border border-border rounded-sm p-6 hover:border-ink/40 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-display text-xl text-ink group-hover:opacity-80 transition-opacity">{day.title}</h2>
                    <p className="font-meta text-sm text-muted-foreground mt-1">
                      {formatDate(day.date)}
                      {day.location && ` · ${day.location}`}
                    </p>
                    {day.description && (
                      <p className="text-sm text-muted-foreground mt-3 leading-relaxed line-clamp-2">{day.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-display text-lg text-ink">{formatPrice(day.price)}</p>
                    <p className="font-meta text-xs text-muted-foreground">{day.duration} min</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-meta text-xs text-muted-foreground">
                    {available} slot{available !== 1 ? "s" : ""} available
                  </p>
                  <span className="font-meta text-xs text-ink group-hover:opacity-70 transition-opacity">
                    View slots →
                  </span>
                </div>
                {available === 0 && (
                  <p className="font-meta text-xs text-rose mt-2">Fully booked</p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
