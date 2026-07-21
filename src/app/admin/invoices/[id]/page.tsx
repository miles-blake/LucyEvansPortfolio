import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markInvoicePaid, deleteInvoice } from "../actions";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id }, select: { number: true } });
  if (!inv) return {};
  return { title: `Invoice — ${inv.number}` };
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-sky/20 text-sky",
  SENT: "bg-blush/30 text-rose",
  PAID: "bg-sage/20 text-sage",
  CANCELLED: "bg-ink/10 text-ink",
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type LineItem = { description: string; amount: number };

export default async function InvoiceDetailPage({ params }: Props) {
  const { id } = await params;
  const inv = await prisma.invoice.findUnique({ where: { id } });
  if (!inv) notFound();

  const lineItems = (inv.lineItems as unknown as LineItem[]) ?? [];

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/invoices"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> All invoices
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">{inv.number}</h1>
          <p className="font-meta text-sm text-muted-foreground mt-1">
            Created {formatDate(inv.createdAt)}
          </p>
        </div>
        <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${STATUS_COLOR[inv.status] ?? "bg-ink/10 text-ink"}`}>
          {inv.status.toLowerCase()}
        </span>
      </div>

      <div className="space-y-6">
        {/* Customer */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Customer</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            <dt className="font-meta text-sm text-muted-foreground">Name</dt>
            <dd className="text-sm text-ink">{inv.customerName}</dd>
            <dt className="font-meta text-sm text-muted-foreground">Email</dt>
            <dd className="text-sm text-ink">{inv.customerEmail}</dd>
            {inv.customerPhone && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Phone</dt>
                <dd className="text-sm text-ink">{inv.customerPhone}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Line items */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Line items</h2>
          <ul className="space-y-2 mb-4">
            {lineItems.map((item, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink">{item.description}</span>
                <span className={`font-meta ${item.amount < 0 ? "text-sage" : "text-muted-foreground"}`}>
                  {item.amount < 0 ? `−${formatPrice(Math.abs(item.amount))}` : formatPrice(item.amount)}
                </span>
              </li>
            ))}
          </ul>
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-meta text-muted-foreground">Subtotal</span>
              <span className="text-ink">{formatPrice(inv.subtotal)}</span>
            </div>
            {inv.depositPaid > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="font-meta text-muted-foreground">Deposit paid</span>
                <span className="text-sage">−{formatPrice(inv.depositPaid)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-medium border-t border-border pt-2 mt-2">
              <span className="text-ink">Amount due</span>
              <span className="font-display text-ink">{formatPrice(inv.amountDue)}</span>
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Details</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            <dt className="font-meta text-sm text-muted-foreground">Type</dt>
            <dd className="text-sm text-ink capitalize">{inv.type.toLowerCase()}</dd>
            {inv.dueDate && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Due date</dt>
                <dd className="text-sm text-ink">{formatDate(inv.dueDate)}</dd>
              </>
            )}
            {inv.bookingId && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Booking</dt>
                <dd className="text-sm">
                  <Link href={`/admin/bookings/${inv.bookingId}`} className="text-sky hover:opacity-70 transition-opacity">
                    View booking
                  </Link>
                </dd>
              </>
            )}
            {inv.orderId && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Order</dt>
                <dd className="text-sm">
                  <Link href={`/admin/orders`} className="text-sky hover:opacity-70 transition-opacity">
                    View orders
                  </Link>
                </dd>
              </>
            )}
          </dl>
        </section>

        {/* Notes */}
        {inv.notes && (
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-4">Notes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{inv.notes}</p>
          </section>
        )}

        {/* Actions */}
        {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-4">Actions</h2>
            <div className="flex items-center gap-3">
              <form action={markInvoicePaid}>
                <input type="hidden" name="id" value={inv.id} />
                <button
                  type="submit"
                  className="text-xs bg-sage text-white px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta"
                >
                  Mark as paid
                </button>
              </form>
              <form action={deleteInvoice}>
                <input type="hidden" name="id" value={inv.id} />
                <button
                  type="submit"
                  className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-sm hover:text-rose hover:border-rose transition-colors font-meta"
                >
                  Delete invoice
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
