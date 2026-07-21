import { prisma } from "@/lib/prisma";
import { addBlackoutDate, deleteBlackoutDate } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function AvailabilityPage() {
  const blackouts = await prisma.blackoutDate.findMany({
    orderBy: { date: "asc" },
    where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });

  const past = await prisma.blackoutDate.findMany({
    orderBy: { date: "desc" },
    where: { date: { lt: new Date(new Date().setHours(0, 0, 0, 0)) } },
    take: 5,
  });

  const inputCls = "border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Availability</h1>
        <p className="font-meta text-xs text-muted-foreground mt-1">
          Dates you block here will be unavailable on the booking form — clients won&apos;t be able to request them.
        </p>
      </div>

      {/* Add form */}
      <section className="border border-border rounded-sm p-6">
        <h2 className="font-display text-lg text-ink mb-4">Block a date</h2>
        <form action={addBlackoutDate} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="font-meta text-xs text-muted-foreground block mb-1">Date</label>
            <input name="date" type="date" required className={inputCls} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="font-meta text-xs text-muted-foreground block mb-1">Reason (optional)</label>
            <input name="reason" type="text" placeholder="e.g. Personal travel, Holiday" className={`${inputCls} w-full`} />
          </div>
          <button
            type="submit"
            className="bg-ink text-cream font-meta text-xs px-4 py-2 rounded-sm hover:opacity-80 transition-opacity"
          >
            Block date
          </button>
        </form>
      </section>

      {/* Upcoming blocked dates */}
      <section>
        <h2 className="font-display text-lg text-ink mb-3">Blocked dates</h2>
        {blackouts.length === 0 ? (
          <p className="font-meta text-sm text-muted-foreground">No dates blocked yet.</p>
        ) : (
          <ul className="space-y-2">
            {blackouts.map((b) => (
              <li key={b.id} className="flex items-center justify-between border border-border rounded-sm px-4 py-3">
                <div>
                  <p className="text-sm text-ink">{formatDate(b.date)}</p>
                  {b.reason && <p className="font-meta text-xs text-muted-foreground mt-0.5">{b.reason}</p>}
                </div>
                <form action={deleteBlackoutDate}>
                  <input type="hidden" name="id" value={b.id} />
                  <button
                    type="submit"
                    className="font-meta text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="font-meta text-xs text-muted-foreground mb-2">Recent past</h2>
          <ul className="space-y-1">
            {past.map((b) => (
              <li key={b.id} className="flex items-center justify-between px-4 py-2 opacity-50">
                <p className="text-sm text-ink">{formatDate(b.date)}{b.reason ? ` — ${b.reason}` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
