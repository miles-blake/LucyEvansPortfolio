import { prisma } from "@/lib/prisma";
import { updateBookingStatus } from "./actions";
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
      <h1 className="font-display text-2xl text-ink mb-6">Bookings</h1>

      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Client</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Package</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Date</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Deposit</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No bookings yet.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-ink/5">
                <td className="px-4 py-3">
                  <p className="text-ink">{b.customerName}</p>
                  <p className="font-meta text-xs text-muted-foreground">{b.customerEmail}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.package.name}</td>
                <td className="px-4 py-3 font-meta text-muted-foreground">{formatDate(b.eventDate)}</td>
                <td className="px-4 py-3">
                  <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                    b.depositPaid ? "bg-sage/20 text-sage" : "bg-blush/30 text-rose"
                  }`}>
                    {b.depositPaid ? "Paid" : "Unpaid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <form action={updateBookingStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={b.id} />
                    <select
                      name="status"
                      defaultValue={b.status}
                      className="text-xs border border-border rounded-sm px-2 py-1 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.toLowerCase()}</option>
                      ))}
                    </select>
                    <button type="submit" className="text-xs text-muted-foreground hover:text-ink">Save</button>
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
