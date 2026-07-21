import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };
export const dynamic = "force-dynamic";

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

export default async function AnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    topPhotos,
    bookingsByType,
    funnelCounts,
    recentRevenue,
    discountUsage,
  ] = await Promise.all([
    // Top-selling photos
    prisma.orderItem.groupBy({
      by: ["photoId"],
      where: { photoId: { not: null }, order: { status: "PAID" } },
      _count: { photoId: true },
      _sum: { price: true },
      orderBy: { _count: { photoId: "desc" } },
      take: 10,
    }),

    // Revenue by event type
    prisma.booking.groupBy({
      by: ["eventType"],
      where: { status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { totalPrice: true },
      _count: { eventType: true },
      orderBy: { _sum: { totalPrice: "desc" } },
    }),

    // Booking conversion funnel
    prisma.booking.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // Revenue last 30 days
    prisma.order.aggregate({
      where: { status: "PAID", createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
      _count: true,
    }),

    // Top discount codes by usage
    prisma.discountCode.findMany({
      where: { usageCount: { gt: 0 } },
      orderBy: { usageCount: "desc" },
      take: 5,
    }),
  ]);

  // Fetch photo names for top sellers
  const photoIds = topPhotos.map((t) => t.photoId!).filter(Boolean);
  const photos = await prisma.photo.findMany({
    where: { id: { in: photoIds } },
    select: { id: true, title: true },
  });
  const photoMap = Object.fromEntries(photos.map((p) => [p.id, p.title]));

  const funnel = Object.fromEntries(funnelCounts.map((f) => [f.status, f._count.status]));
  const totalBookings = funnelCounts.reduce((s, f) => s + f._count.status, 0);

  function pct(n: number) {
    return totalBookings > 0 ? Math.round((n / totalBookings) * 100) : 0;
  }

  const maxEventRevenue = Math.max(...bookingsByType.map((b) => b._sum.totalPrice ?? 0), 1);

  return (
    <div className="max-w-4xl space-y-10">
      <h1 className="font-display text-2xl text-ink">Analytics</h1>

      {/* Last 30 days summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="border border-border rounded-sm p-4">
          <p className="font-meta text-xs text-muted-foreground">Revenue (30 days)</p>
          <p className="font-display text-2xl text-ink mt-1">{fmt(recentRevenue._sum.totalAmount ?? 0)}</p>
        </div>
        <div className="border border-border rounded-sm p-4">
          <p className="font-meta text-xs text-muted-foreground">Orders (30 days)</p>
          <p className="font-display text-2xl text-ink mt-1">{recentRevenue._count}</p>
        </div>
        <div className="border border-border rounded-sm p-4">
          <p className="font-meta text-xs text-muted-foreground">Conversion rate</p>
          <p className="font-display text-2xl text-ink mt-1">
            {pct((funnel["CONFIRMED"] ?? 0) + (funnel["COMPLETED"] ?? 0))}%
          </p>
          <p className="font-meta text-[11px] text-muted-foreground mt-0.5">Inquiry → Confirmed</p>
        </div>
      </div>

      {/* Booking funnel */}
      <section>
        <h2 className="font-display text-lg text-ink mb-4">Booking funnel</h2>
        <div className="space-y-2">
          {[
            { label: "Total inquiries", key: "INQUIRY", color: "bg-sky/40" },
            { label: "Confirmed", key: "CONFIRMED", color: "bg-sage/40" },
            { label: "Completed", key: "COMPLETED", color: "bg-ink/20" },
            { label: "Cancelled", key: "CANCELLED", color: "bg-rose/30" },
          ].map(({ label, key, color }) => {
            const count = funnel[key] ?? 0;
            const width = totalBookings > 0 ? Math.round((count / totalBookings) * 100) : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="w-28 text-right font-meta text-xs text-muted-foreground shrink-0">{label}</div>
                <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                  <div className={`h-full ${color} rounded-sm transition-all`} style={{ width: `${width}%` }} />
                </div>
                <div className="w-12 font-meta text-xs text-ink shrink-0">{count} <span className="text-muted-foreground">({pct(count)}%)</span></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Revenue by event type */}
      {bookingsByType.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Revenue by event type</h2>
          <div className="space-y-2">
            {bookingsByType.map((b) => {
              const rev = b._sum.totalPrice ?? 0;
              const width = Math.round((rev / maxEventRevenue) * 100);
              return (
                <div key={b.eventType} className="flex items-center gap-3">
                  <div className="w-28 text-right font-meta text-xs text-muted-foreground capitalize shrink-0">{b.eventType}</div>
                  <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                    <div className="h-full bg-ink/20 rounded-sm" style={{ width: `${width}%` }} />
                  </div>
                  <div className="w-24 font-meta text-xs text-ink shrink-0">{fmt(rev)} <span className="text-muted-foreground">· {b._count.eventType}</span></div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Top-selling photos */}
      {topPhotos.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Top-selling photos</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-meta text-xs text-muted-foreground pb-2">Photo</th>
                <th className="text-right font-meta text-xs text-muted-foreground pb-2">Sales</th>
                <th className="text-right font-meta text-xs text-muted-foreground pb-2">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topPhotos.map((t) => (
                <tr key={t.photoId}>
                  <td className="py-2.5 text-ink">{photoMap[t.photoId!] ?? "—"}</td>
                  <td className="py-2.5 text-right font-meta text-muted-foreground">{t._count.photoId}</td>
                  <td className="py-2.5 text-right font-meta text-ink">{fmt(t._sum.price ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Discount code usage */}
      {discountUsage.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Discount code usage</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-meta text-xs text-muted-foreground pb-2">Code</th>
                <th className="text-left font-meta text-xs text-muted-foreground pb-2">Discount</th>
                <th className="text-right font-meta text-xs text-muted-foreground pb-2">Uses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {discountUsage.map((d) => (
                <tr key={d.id}>
                  <td className="py-2.5 font-meta text-ink">{d.code}</td>
                  <td className="py-2.5 text-muted-foreground">
                    {d.type === "percent" ? `${d.amount}% off` : `${fmt(d.amount)} off`}
                  </td>
                  <td className="py-2.5 text-right font-meta text-ink">{d.usageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
