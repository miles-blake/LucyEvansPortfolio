import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Orders" };
export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          photo: { select: { title: true } },
          bundle: { select: { title: true } },
        },
      },
    },
  });

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl text-ink mb-6">Orders</h1>

      <div className="border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Customer</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Items</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Total</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Status</th>
              <th className="text-left px-4 py-3 font-display text-ink font-normal">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No orders yet.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-ink/5">
                <td className="px-4 py-3 text-ink">{o.customerEmail || "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {o.items.map((item) => item.photo?.title ?? item.bundle?.title ?? "—").join(", ")}
                </td>
                <td className="px-4 py-3 font-meta text-muted-foreground">
                  ${(o.totalAmount / 100).toFixed(0)}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                    o.status === "PAID" ? "bg-sage/20 text-sage" :
                    o.status === "PENDING" ? "bg-sky/20 text-sky" :
                    o.status === "FAILED" ? "bg-rose/20 text-rose" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {o.status.toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-3 font-meta text-xs text-muted-foreground">
                  {formatDate(o.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
