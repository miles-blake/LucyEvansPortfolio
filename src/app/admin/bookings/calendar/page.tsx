import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Bookings Calendar" };
export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: "bg-sage/20 text-sage",
  INQUIRY: "bg-sky/20 text-sky",
  COMPLETED: "bg-ink/10 text-ink",
  CANCELLED: "bg-rose/20 text-rose",
};

function buildMonthGrid(year: number, month: number) {
  // Returns array of 6 rows × 7 cols (null = padding day, number = day of month)
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default async function BookingsCalendarPage() {
  const now = new Date();
  const months = [-1, 0, 1].map((offset) => ({
    year: new Date(now.getFullYear(), now.getMonth() + offset, 1).getFullYear(),
    month: new Date(now.getFullYear(), now.getMonth() + offset, 1).getMonth(),
  }));

  const start = new Date(months[0].year, months[0].month, 1);
  const end = new Date(months[2].year, months[2].month + 1, 0, 23, 59, 59);

  const bookings = await prisma.booking.findMany({
    where: { eventDate: { gte: start, lte: end } },
    select: { id: true, customerName: true, eventDate: true, status: true, eventType: true },
    orderBy: { eventDate: "asc" },
  });

  // Index bookings by YYYY-MM-DD
  const byDate: Record<string, typeof bookings> = {};
  for (const b of bookings) {
    const d = new Date(b.eventDate);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(b);
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/bookings" className="font-meta text-sm text-muted-foreground hover:text-ink transition-colors">
          ← List view
        </Link>
        <h1 className="font-display text-2xl text-ink">Bookings — Calendar</h1>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-6">
        {Object.entries(STATUS_COLOR).map(([status, cls]) => (
          <span key={status} className={`font-meta text-xs px-2 py-0.5 rounded-sm ${cls}`}>
            {status.toLowerCase()}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {months.map(({ year, month }) => {
          const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
          const cells = buildMonthGrid(year, month);
          const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

          return (
            <div key={`${year}-${month}`} className="border border-border rounded-sm p-4">
              <h2 className={`font-display text-base mb-3 ${isCurrentMonth ? "text-ink" : "text-muted-foreground"}`}>
                {monthLabel}
              </h2>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="font-meta text-xs text-muted-foreground text-center py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayBookings = byDate[dateKey] ?? [];
                  const isToday =
                    day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

                  return (
                    <div key={dateKey} className={`min-h-[2.5rem] p-0.5 rounded-sm ${isToday ? "bg-sky/10" : ""}`}>
                      <span className={`font-meta text-xs block text-center mb-0.5 ${isToday ? "text-sky font-bold" : "text-muted-foreground"}`}>
                        {day}
                      </span>
                      {dayBookings.map((b) => (
                        <Link
                          key={b.id}
                          href={`/admin/bookings/${b.id}`}
                          className={`block text-xs px-1 py-0.5 rounded-sm truncate mb-0.5 font-meta leading-tight ${STATUS_COLOR[b.status] ?? "bg-ink/10 text-ink"}`}
                          title={`${b.customerName} — ${b.eventType}`}
                        >
                          {b.customerName.split(" ")[0]}
                        </Link>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
