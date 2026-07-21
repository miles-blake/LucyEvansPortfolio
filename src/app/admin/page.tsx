import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [photos, bundles, bookings, orders, subscribers, portfolio] = await Promise.all([
    prisma.photo.count(),
    prisma.bundle.count(),
    prisma.booking.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.subscriber.count(),
    prisma.portfolioPiece.count(),
  ]);

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
    ...recentOrdersAll.map((o) => ({ id: o.id, type: "order" as const, label: `Order paid — ${o.customerEmail}`, sub: `$${(o.totalAmount / 100).toFixed(0)}`, href: `/admin/orders`, date: o.createdAt })),
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
              <div key={b.id} className="flex items-center justify-between text-sm border border-border rounded-sm px-3 py-2">
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
              </div>
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
              <div key={o.id} className="flex items-center justify-between text-sm border border-border rounded-sm px-3 py-2">
                <p className="text-ink truncate max-w-[60%]">{o.customerEmail || "—"}</p>
                <span className="font-meta text-xs text-muted-foreground">
                  ${(o.totalAmount / 100).toFixed(0)}
                </span>
              </div>
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
