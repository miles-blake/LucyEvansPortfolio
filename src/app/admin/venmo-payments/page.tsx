import { prisma } from "@/lib/prisma";
import { confirmVenmoPayment, rejectVenmoPayment } from "./actions";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Venmo Payments" };
export const dynamic = "force-dynamic";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const inputCls = "w-full border border-border rounded-sm px-3 py-2 text-sm bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30";

export default async function VenmoPaymentsPage() {
  const payments = await prisma.venmoPayment.findMany({
    include: {
      booking: { select: { id: true, customerName: true, customerEmail: true } },
      order: { select: { id: true, customerName: true, customerEmail: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const pending = payments.filter((p) => p.status === "pending");
  const resolved = payments.filter((p) => p.status !== "pending");

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl text-ink">Venmo payments</h1>
        <p className="font-meta text-xs text-muted-foreground mt-1">
          Review client payment screenshots, upload your confirmation, and mark as confirmed or rejected.
        </p>
      </div>

      {/* Pending */}
      <section>
        <h2 className="font-display text-lg text-ink mb-4">
          Pending review
          {pending.length > 0 && (
            <span className="ml-2 font-meta text-xs bg-rose/10 text-rose px-2 py-0.5 rounded-full">{pending.length}</span>
          )}
        </h2>

        {pending.length === 0 ? (
          <p className="font-meta text-sm text-muted-foreground">No pending payments.</p>
        ) : (
          <ul className="space-y-4">
            {pending.map((p) => (
              <li key={p.id} id={p.id} className="border border-border rounded-sm p-5 space-y-4 scroll-mt-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {p.booking ? (
                        <Link href={`/admin/bookings/${p.booking.id}`} className="hover:opacity-70 transition-opacity">
                          {p.booking.customerName}
                        </Link>
                      ) : p.order ? (
                        <Link href={`/admin/orders/${p.order.id}`} className="hover:opacity-70 transition-opacity">
                          {p.order.customerName}
                        </Link>
                      ) : "Unknown"}
                      {" · "}{formatPrice(p.amount)}{" · "}
                      <span className="capitalize">{p.type}</span>
                    </p>
                    <p className="font-meta text-xs text-muted-foreground mt-0.5">
                      {p.booking?.customerEmail ?? p.order?.customerEmail ?? ""} · {formatDate(p.createdAt)}
                    </p>
                  </div>
                  <span className="font-meta text-xs bg-sky/20 text-sky px-2 py-0.5 rounded-sm whitespace-nowrap">pending</span>
                </div>

                {/* Client proof */}
                <div>
                  <p className="font-meta text-xs text-muted-foreground mb-2">Client screenshot:</p>
                  <a href={p.clientProofUrl} target="_blank" rel="noopener noreferrer">
                    <img src={p.clientProofUrl} alt="Client payment proof" className="max-h-64 rounded-sm border border-border object-contain hover:opacity-90 transition-opacity" />
                  </a>
                </div>

                {/* Confirm form */}
                <form action={confirmVenmoPayment} className="space-y-3 pt-2 border-t border-border">
                  <input type="hidden" name="id" value={p.id} />
                  <div>
                    <label className="font-meta text-xs text-muted-foreground block mb-1">
                      Upload your Venmo confirmation screenshot *
                    </label>
                    <input
                      name="adminProof"
                      type="file"
                      accept="image/*"
                      required
                      className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-sm file:border file:border-border file:text-xs file:font-meta file:bg-cream file:text-ink hover:file:opacity-70 file:cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button type="submit" className="text-xs bg-sage text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta">
                      Confirm payment
                    </button>
                  </div>
                </form>

                {/* Reject form */}
                <form action={rejectVenmoPayment} className="space-y-2 pt-2 border-t border-border">
                  <input type="hidden" name="id" value={p.id} />
                  <input name="note" type="text" className={inputCls} placeholder="Reason for rejection (sent to client)…" />
                  <button type="submit" className="text-xs border border-rose/40 text-rose px-3 py-1.5 rounded-sm hover:bg-rose/5 transition-colors font-meta">
                    Reject payment
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Resolved */}
      {resolved.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-ink mb-4">Resolved</h2>
          <ul className="space-y-2">
            {resolved.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 border border-border rounded-sm px-4 py-3 text-sm">
                <div>
                  <p className="text-ink">
                    {p.booking ? (
                      <Link href={`/admin/bookings/${p.booking.id}`} className="hover:opacity-70">{p.booking.customerName}</Link>
                    ) : p.order ? (
                      <Link href={`/admin/orders/${p.order.id}`} className="hover:opacity-70">{p.order.customerName}</Link>
                    ) : "Unknown"}
                    {" · "}{formatPrice(p.amount)}
                  </p>
                  <p className="font-meta text-xs text-muted-foreground mt-0.5">{formatDate(p.createdAt)}</p>
                  {p.status === "rejected" && p.rejectionNote && (
                    <p className="font-meta text-xs text-rose mt-0.5">{p.rejectionNote}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {p.adminProofUrl && (
                    <a href={p.adminProofUrl} target="_blank" rel="noopener noreferrer" className="font-meta text-xs text-sky hover:opacity-70">
                      View proof →
                    </a>
                  )}
                  <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                    p.status === "confirmed" ? "bg-sage/20 text-sage" : "bg-rose/10 text-rose"
                  }`}>
                    {p.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
