import { prisma } from "@/lib/prisma";
import { updateBookingStatus } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Bookings" };
export const dynamic = "force-dynamic";

const STATUS_OPTIONS = ["INQUIRY", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    orderBy: { eventDate: "asc" },
    include: { package: { select: { name: true } } },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Bookings</h1>
        <Link href="/admin/bookings/calendar" className="text-xs text-muted-foreground hover:text-ink transition-colors font-meta">
          Calendar →
        </Link>
      </div>

      <div className="border border-border rounded-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Client</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden sm:table-cell">Package</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden sm:table-cell">Date</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Deposit</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No bookings yet.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="relative hover:bg-ink/5 cursor-pointer">
                <td className="px-3 md:px-4 py-3">
                  <Link href={`/admin/bookings/${b.id}`} className="absolute inset-0 z-0" aria-label={`View booking for ${b.customerName}`} />
                  <p className="relative z-10 text-ink">{b.customerName}</p>
                  <p className="relative z-10 font-meta text-xs text-muted-foreground">{b.customerEmail}</p>
                </td>
                <td className="px-3 md:px-4 py-3 text-muted-foreground hidden sm:table-cell">{b.package.name}</td>
                <td className="px-3 md:px-4 py-3 font-meta text-muted-foreground hidden sm:table-cell">{formatDate(b.eventDate)}</td>
                <td className="px-3 md:px-4 py-3 hidden md:table-cell">
                  <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                    b.depositPaid ? "bg-sage/20 text-sage" : "bg-blush/30 text-rose"
                  }`}>
                    {b.depositPaid ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="px-3 md:px-4 py-3">
                  <form action={updateBookingStatus} className="relative z-10 flex items-center gap-1.5">
                    <input type="hidden" name="id" value={b.id} />
                    <select
                      name="status"
                      defaultValue={b.status}
                      className="text-xs border border-border rounded-sm px-1.5 py-1 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40 max-w-[90px] sm:max-w-none"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.toLowerCase()}</option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs text-muted-foreground hover:text-ink shrink-0">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
