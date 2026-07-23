import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — Bookings Kanban" };

const COLUMNS = ["INQUIRY", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
type BookingStatus = (typeof COLUMNS)[number];

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

const columnStyles: Record<BookingStatus, { header: string; badge: string }> = {
  INQUIRY: {
    header: "bg-sky/10 text-sky border-sky/20",
    badge: "bg-sky/20 text-sky",
  },
  CONFIRMED: {
    header: "bg-sage/10 text-sage border-sage/20",
    badge: "bg-sage/20 text-sage",
  },
  COMPLETED: {
    header: "bg-ink/8 text-ink border-border",
    badge: "bg-ink/10 text-ink",
  },
  CANCELLED: {
    header: "bg-rose/10 text-rose border-rose/20",
    badge: "bg-rose/10 text-rose",
  },
};

export default async function BookingsKanbanPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { eventDate: "asc" },
    include: { package: { select: { name: true } } },
  });

  const grouped = Object.fromEntries(
    COLUMNS.map((col) => [col, bookings.filter((b) => b.status === col)])
  ) as Record<BookingStatus, typeof bookings>;

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Bookings — Kanban</h1>
        <Link
          href="/admin/bookings"
          className="text-xs text-muted-foreground hover:text-ink transition-colors font-meta"
        >
          ← List view
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const items = grouped[col];
          const styles = columnStyles[col];
          return (
            <div key={col} className="flex flex-col min-h-[200px]">
              <div className={`flex items-center justify-between px-3 py-2 rounded-t-sm border ${styles.header} mb-2`}>
                <span className="font-meta text-xs font-semibold uppercase tracking-wider">
                  {col.toLowerCase()}
                </span>
                <span className="font-meta text-xs opacity-70">{items.length}</span>
              </div>
              <div className="flex-1 space-y-2">
                {items.length === 0 && (
                  <div className="border border-dashed border-border rounded-sm px-3 py-6 text-center">
                    <p className="font-meta text-xs text-muted-foreground">No bookings</p>
                  </div>
                )}
                {items.map((b) => (
                  <Link
                    key={b.id}
                    href={`/admin/bookings/${b.id}`}
                    className="block border border-border rounded-sm px-3 py-3 hover:bg-ink/5 transition-colors bg-cream"
                  >
                    <p className="text-sm text-ink font-medium leading-snug mb-1 truncate">{b.customerName}</p>
                    <p className="font-meta text-xs text-muted-foreground mb-2 truncate">{b.eventType}</p>
                    <p className="font-meta text-xs text-muted-foreground mb-2">
                      {formatDate(b.eventDate)}
                    </p>
                    <span className={`inline-block font-meta text-[10px] px-1.5 py-0.5 rounded-sm ${
                      b.depositPaid ? "bg-sage/20 text-sage" : "bg-blush/30 text-rose"
                    }`}>
                      {b.depositPaid ? "deposit paid" : "deposit unpaid"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
