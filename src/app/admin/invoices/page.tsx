import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";


export const metadata: Metadata = { title: "Admin — Invoices" };
export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-sky/20 text-sky",
  SENT: "bg-blush/30 text-rose",
  PAID: "bg-sage/20 text-sage",
  CANCELLED: "bg-ink/10 text-ink",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function AdminInvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-ink">Invoices</h1>
        <Link
          href="/admin/invoices/new"
          className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors"
        >
          New invoice →
        </Link>
      </div>

      <div className="border border-border rounded-sm">
        <table className="w-full text-sm">
          <thead className="bg-ink/5 border-b border-border">
            <tr>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Number</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Customer</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden sm:table-cell">Type</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Amount</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal hidden md:table-cell">Due date</th>
              <th className="text-left px-3 md:px-4 py-3 font-display text-ink font-normal">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No invoices yet.
                </td>
              </tr>
            )}
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-ink/5">
                <td className="px-3 md:px-4 py-3">
                  <Link
                    href={`/admin/invoices/${inv.id}`}
                    className="font-meta text-sm text-ink hover:opacity-70 transition-opacity"
                  >
                    {inv.number}
                  </Link>
                </td>
                <td className="px-3 md:px-4 py-3">
                  <p className="text-ink truncate max-w-[120px] sm:max-w-none">{inv.customerName}</p>
                  <p className="font-meta text-xs text-muted-foreground hidden sm:block">{inv.customerEmail}</p>
                </td>
                <td className="px-3 md:px-4 py-3 text-muted-foreground capitalize hidden sm:table-cell">{inv.type.toLowerCase()}</td>
                <td className="px-3 md:px-4 py-3 font-meta text-muted-foreground">{formatPrice(inv.amountDue)}</td>
                <td className="px-3 md:px-4 py-3 font-meta text-xs text-muted-foreground hidden md:table-cell">
                  {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                </td>
                <td className="px-3 md:px-4 py-3">
                  <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${STATUS_COLOR[inv.status] ?? "bg-ink/10 text-ink"}`}>
                    {inv.status.toLowerCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
