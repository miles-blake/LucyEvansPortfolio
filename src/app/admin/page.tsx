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
    </div>
  );
}
