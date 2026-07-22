import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

function buildMonthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatRevenue(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [photos, bundles, bookings, orders, subscribers, portfolio, paidOrders, paidInvoices, allTimeOrders, allTimeInvoices, upcomingBookings] = await Promise.all([
    prisma.photo.count(),
    prisma.bundle.count(),
    prisma.booking.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.subscriber.count(),
    prisma.portfolioPiece.count(),
    prisma.order.findMany({
      where: { status: "PAID", createdAt: { gte: sixMonthsAgo } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID", createdAt: { gte: sixMonthsAgo } },
      select: { amountDue: true, createdAt: true },
    }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { totalAmount: true } }),
    prisma.invoice.aggregate({ where: { status: "PAID" }, _sum: { amountDue: true } }),
    prisma.booking.findMany({
      where: { status: { in: ["INQUIRY", "CONFIRMED"] }, eventDate: { gte: now } },
      select: { id: true, customerName: true, eventDate: true, eventType: true, totalPrice: true, depositAmount: true, depositPaid: true, status: true },
      orderBy: { eventDate: "asc" },
      take: 10,
    }),
  ]);

  // Build 6-month bar chart data
  const months: { key: string; label: string; orders: number; invoices: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: buildMonthKey(d),
      label: d.toLocaleDateString("en-US", { month: "short" }),
      orders: 0,
      invoices: 0,
    });
  }
  for (const o of paidOrders) {
    const k = buildMonthKey(new Date(o.createdAt));
    const m = months.find((m) => m.key === k);
    if (m) m.orders += o.totalAmount;
  }
  for (const inv of paidInvoices) {
    const k = buildMonthKey(new Date(inv.createdAt));
    const m = months.find((m) => m.key === k);
    if (m) m.invoices += inv.amountDue;
  }
  const maxMonth = Math.max(...months.map((m) => m.orders + m.invoices), 1);

  // Summary numbers
  const allTimeRevenue = (allTimeOrders._sum.totalAmount ?? 0) + (allTimeInvoices._sum.amountDue ?? 0);
  const thisMonthKey = buildMonthKey(startOfThisMonth);
  const lastMonthKey = buildMonthKey(startOfLastMonth);
  const thisMonth = months.find((m) => m.key === thisMonthKey);
  const lastMonth = months.find((m) => m.key === lastMonthKey);
  const revenueThisMonth = (thisMonth?.orders ?? 0) + (thisMonth?.invoices ?? 0);
  const revenueLastMonth = (lastMonth?.orders ?? 0) + (lastMonth?.invoices ?? 0);

  const recentBookings = await prisma.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { package: { select: { name: true } } },
  });

  const recentOrders = await prisma.order.findMany({
    take: 5,
    where: { status: "PAID" },
    orderBy: { createdAt: "desc" },
  });

  const [recentInquiries, recentSubscribers, recentBookingsAll, recentOrdersAll] = await Promise.all([
    prisma.inquiry.findMany({ take: 5, orderBy: { createdAt: "desc" }, select: { id: true, name: true, subject: true, createdAt: true, status: true } }),
    prisma.subscriber.findMany({ take: 5, orderBy: { subscribedAt: "desc" }, select: { id: true, email: true, subscribedAt: true } }),
    prisma.booking.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { package: { select: { name: true } } } }),
    prisma.order.findMany({ take: 5, where: { status: "PAID" }, orderBy: { createdAt: "desc" }, select: { id: true, customerEmail: true, totalAmount: true, createdAt: true } }),
  ]);

  type ActivityItem = { id: string; type: "inquiry" | "subscriber" | "booking" | "order"; label: string; sub: string; href: string; date: Date; };

  const activity: ActivityItem[] = [
    ...recentInquiries.map((i) => ({ id: i.id, type: "inquiry" as const, label: `New inquiry from ${i.name}`, sub: i.subject, href: `/admin/inquiries/${i.id}`, date: i.createdAt })),
    ...recentSubscribers.map((s) => ({ id: s.id, type: "subscriber" as const, label: `New subscriber`, sub: s.email, href: `/admin/subscribers`, date: s.subscribedAt })),
    ...recentBookingsAll.map((b) => ({ id: b.id, type: "booking" as const, label: `Booking ${b.status.toLowerCase()} — ${b.customerName}`, sub: b.package.name, href: `/admin/bookings/${b.id}`, date: b.createdAt })),
    ...recentOrdersAll.map((o) => ({ id: o.id, type: "order" as const, label: `Order paid — ${o.customerEmail}`, sub: `$${(o.totalAmount / 100).toFixed(0)}`, href: `/admin/orders/${o.id}`, date: o.createdAt })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

  const stats = [
    { label: "Photos", value: photos, href: "/admin/photos" },
    { label: "Bundles", value: bundles, href: "/admin/bundles" },
    { label: "Bookings", value: bookings, href: "/admin/bookings" },
    { label: "Paid orders", value: orders, href: "/admin/orders" },
    { label: "Subscribers", value: subscribers, href: "/admin/subscribers" },
    { label: "Portfolio pieces", value: portfolio, href: "/admin/portfolio" },
  ];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl text-ink mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {stats.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="border border-border rounded-sm p-4 hover:border-sky/40 transition-colors"
          >
            <p className="font-display text-3xl text-ink">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{label}</p>
          </Link>
        ))}
      </div>

      {/* Revenue */}
      <section className="border border-border rounded-sm p-6 mb-10">
        <h2 className="font-display text-lg text-ink mb-4">Revenue</h2>

        <div className="grid grid-cols-3 gap-3 md:gap-6 mb-6">
          {[
            { label: "All time", value: formatRevenue(allTimeRevenue) },
            { label: "This month", value: formatRevenue(revenueThisMonth) },
            { label: "Last month", value: formatRevenue(revenueLastMonth) },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="font-display text-lg md:text-2xl text-ink">{value}</p>
              <p className="font-meta text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="flex items-end gap-2 h-24">
          {months.map((m) => {
            const total = m.orders + m.invoices;
            const orderPct = total === 0 ? 0 : Math.round((m.orders / maxMonth) * 100);
            const invoicePct = total === 0 ? 0 : Math.round((m.invoices / maxMonth) * 100);
            return (
              <div key={m.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-20" title={`${m.label}: ${formatRevenue(total)}`}>
                  {invoicePct > 0 && (
                    <div className="w-full bg-sage/50 rounded-t-sm" style={{ height: `${invoicePct}%` }} />
                  )}
                  {orderPct > 0 && (
                    <div className={`w-full bg-sky/50 ${invoicePct === 0 ? "rounded-t-sm" : ""}`} style={{ height: `${orderPct}%` }} />
                  )}
                  {total === 0 && <div className="w-full bg-border/50 rounded-sm" style={{ height: "4px" }} />}
                </div>
                <span className="font-meta text-xs text-muted-foreground">{m.label}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 font-meta text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky/50 inline-block" /> Orders
          </span>
          <span className="flex items-center gap-1.5 font-meta text-xs text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm bg-sage/50 inline-block" /> Invoices
          </span>
        </div>
      </section>

      {/* Revenue forecast */}
      {upcomingBookings.length > 0 && (() => {
        const forecastItems = upcomingBookings.map((b) => {
          const remaining = b.depositPaid ? b.totalPrice - b.depositAmount : b.totalPrice;
          return { ...b, remaining };
        });
        const forecastTotal = forecastItems.reduce((s, b) => s + b.remaining, 0);
        const confirmedTotal = forecastItems.filter((b) => b.status === "CONFIRMED").reduce((s, b) => s + b.remaining, 0);
        return (
          <section className="border border-border rounded-sm p-6 mb-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-lg text-ink">Revenue forecast</h2>
                <p className="font-meta text-xs text-muted-foreground mt-0.5">Expected from upcoming bookings</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl text-ink">{formatRevenue(forecastTotal)}</p>
                {confirmedTotal !== forecastTotal && (
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">{formatRevenue(confirmedTotal)} confirmed</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              {forecastItems.map((b) => (
                <Link key={b.id} href={`/admin/bookings/${b.id}`}
                  className="flex items-center justify-between text-sm border border-border rounded-sm px-3 py-2 hover:bg-ink/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-meta text-xs px-1.5 py-0.5 rounded-sm shrink-0 ${
                      b.status === "CONFIRMED" ? "bg-sage/20 text-sage" : "bg-sky/20 text-sky"
                    }`}>{b.status.toLowerCase()}</span>
                    <div className="min-w-0">
                      <p className="text-ink truncate">{b.customerName}</p>
                      <p className="font-meta text-xs text-muted-foreground">
                        {b.eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {b.eventType}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-ink">{formatRevenue(b.remaining)}</p>
                    {b.depositPaid && (
                      <p className="font-meta text-xs text-muted-foreground">deposit paid</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })()}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Recent bookings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Recent bookings</h2>
            <Link href="/admin/bookings" className="text-xs text-muted-foreground hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentBookings.length === 0 && (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            )}
            {recentBookings.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between text-sm border border-border rounded-sm px-3 py-2 hover:bg-ink/5 transition-colors">
                <div>
                  <p className="text-ink">{b.customerName}</p>
                  <p className="font-meta text-xs text-muted-foreground">{b.package.name}</p>
                </div>
                <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                  b.status === "CONFIRMED" ? "bg-sage/20 text-sage" :
                  b.status === "INQUIRY" ? "bg-sky/20 text-sky" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {b.status.toLowerCase()}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent orders */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg text-ink">Recent orders</h2>
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-ink">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No paid orders yet.</p>
            )}
            {recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between text-sm border border-border rounded-sm px-3 py-2 hover:bg-ink/5 transition-colors">
                <p className="text-ink truncate max-w-[60%]">{o.customerEmail || "—"}</p>
                <span className="font-meta text-xs text-muted-foreground">
                  ${(o.totalAmount / 100).toFixed(0)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-lg text-ink mb-4">Recent activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <div className="space-y-1">
            {activity.map((item) => (
              <Link key={`${item.type}-${item.id}`} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-sm hover:bg-ink/5 transition-colors border border-transparent hover:border-border">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  item.type === "inquiry" ? "bg-rose" :
                  item.type === "subscriber" ? "bg-sky" :
                  item.type === "booking" ? "bg-sage" : "bg-ink"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink truncate">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
                </div>
                <time className="text-xs text-muted-foreground shrink-0">
                  {item.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </time>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
