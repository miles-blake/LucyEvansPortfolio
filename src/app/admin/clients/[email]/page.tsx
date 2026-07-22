import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Client Profile" };
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ email: string }>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    CONFIRMED: "bg-sage/20 text-sage",
    INQUIRY: "bg-sky/20 text-sky",
    COMPLETED: "bg-muted text-muted-foreground",
    CANCELLED: "bg-rose/10 text-rose",
    PAID: "bg-sage/20 text-sage",
    NEW: "bg-sky/20 text-sky",
    READ: "bg-muted text-muted-foreground",
    REPLIED: "bg-sage/20 text-sage",
    PENDING: "bg-muted text-muted-foreground",
    FAILED: "bg-rose/10 text-rose",
    REFUNDED: "bg-muted text-muted-foreground",
    DRAFT: "bg-muted text-muted-foreground",
    SENT: "bg-sky/20 text-sky",
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

export default async function ClientProfilePage({ params }: Props) {
  const email = decodeURIComponent((await params).email);

  // Check if this email belongs to a merged ClientProfile
  const profile = await prisma.clientProfile.findFirst({
    where: { emails: { has: email } },
  });

  const allEmails = profile ? profile.emails : [email];

  const [bookings, orders, invoices, inquiries, account] = await Promise.all([
    prisma.booking.findMany({
      where: { customerEmail: { in: allEmails } },
      include: {
        package: { select: { name: true } },
        contract: { select: { pdfUrl: true, signedAt: true } },
      },
      orderBy: { eventDate: "desc" },
    }),
    prisma.order.findMany({
      where: { customerEmail: { in: allEmails } },
      include: {
        items: {
          include: {
            photo: { select: { title: true } },
            bundle: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.invoice.findMany({
      where: { customerEmail: { in: allEmails } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inquiry.findMany({
      where: { email: { in: allEmails } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findFirst({
      where: { email: { in: allEmails } },
      select: { name: true, emailVerified: true, createdAt: true },
    }),
  ]);

  if (bookings.length === 0 && orders.length === 0 && invoices.length === 0 && inquiries.length === 0 && !account) {
    return (
      <div className="max-w-3xl">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
        >
          <ArrowLeft size={14} /> All clients
        </Link>
        <p className="text-muted-foreground text-sm">Client not found.</p>
      </div>
    );
  }

  const name =
    profile?.name ||
    account?.name ||
    bookings[0]?.customerName ||
    orders[0]?.customerName ||
    inquiries[0]?.name ||
    email;

  // Collect all phones across all emails
  const phoneSet = new Set<string>();
  if (profile) {
    for (const p of profile.phones) phoneSet.add(p);
  }
  for (const b of bookings) {
    if (b.customerPhone) phoneSet.add(b.customerPhone);
  }
  const phones = Array.from(phoneSet);

  const totalSpent =
    orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.totalAmount, 0) +
    invoices.filter((inv) => inv.status === "PAID").reduce((s, inv) => s + inv.amountDue, 0);

  const bookingRevenue = bookings
    .filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED")
    .reduce((s, b) => s + b.totalPrice, 0);

  return (
    <div className="max-w-3xl">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> All clients
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-2xl text-ink">{name}</h1>
            {profile && (
              <span className="font-meta text-xs px-2 py-0.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-800">
                Merged profile
              </span>
            )}
          </div>
          <div className="mt-1 space-y-0.5">
            {allEmails.map((e) => (
              <p key={e} className="font-meta text-sm text-muted-foreground">{e}</p>
            ))}
          </div>
          {phones.map((p) => (
            <p key={p} className="font-meta text-sm text-muted-foreground">{p}</p>
          ))}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {account && (
            <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${account.emailVerified ? "bg-sage/20 text-sage" : "bg-sky/20 text-sky"}`}>
              {account.emailVerified ? "Has account ✓" : "Account unverified"}
            </span>
          )}
          <Link
            href={`/admin/email?to=${encodeURIComponent(allEmails[0] ?? email)}&subject=${encodeURIComponent(`Hi ${name}`)}`}
            className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors inline-flex items-center gap-1.5"
          >
            Send email →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-border rounded-sm p-4 text-center">
          <p className="font-display text-xl text-ink">{bookings.length}</p>
          <p className="font-meta text-xs text-muted-foreground mt-1">{bookings.length === 1 ? "booking" : "bookings"}</p>
        </div>
        <div className="border border-border rounded-sm p-4 text-center">
          <p className="font-display text-xl text-ink">{orders.length}</p>
          <p className="font-meta text-xs text-muted-foreground mt-1">{orders.length === 1 ? "order" : "orders"}</p>
        </div>
        <div className="border border-border rounded-sm p-4 text-center">
          <p className="font-display text-xl text-ink">{formatMoney(totalSpent)}</p>
          <p className="font-meta text-xs text-muted-foreground mt-1">total spent</p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="border border-border rounded-sm p-5 space-y-3">
          <h2 className="font-display text-lg text-ink">Bookings</h2>
          {bookings.length === 0 ? (
            <p className="font-meta text-xs text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/bookings/${b.id}`}
                  className="flex items-start justify-between gap-4 border border-border rounded-sm px-4 py-3 hover:bg-ink/5 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm text-ink">
                      {b.eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} · {b.eventType}
                    </p>
                    <p className="font-meta text-xs text-muted-foreground">{b.package.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${statusBadge(b.status)}`}>
                        {b.status.toLowerCase()}
                      </span>
                      <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${b.depositPaid ? "bg-sage/20 text-sage" : "bg-rose/10 text-rose"}`}>
                        {b.depositPaid ? "deposit paid" : "deposit unpaid"}
                      </span>
                      {b.contract && (
                        <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${b.contract.signedAt ? "bg-sage/20 text-sage" : "bg-sky/20 text-sky"}`}>
                          {b.contract.signedAt ? "contract signed" : "contract unsigned"}
                        </span>
                      )}
                    </div>
                    {allEmails.length > 1 && (
                      <p className="font-meta text-xs text-muted-foreground/70">{b.customerEmail}</p>
                    )}
                  </div>
                  <p className="font-meta text-sm text-muted-foreground shrink-0">{formatMoney(b.totalPrice)}</p>
                </Link>
              ))}
            </div>
          )}
          {bookingRevenue > 0 && (
            <p className="font-meta text-xs text-muted-foreground pt-1">
              Booking revenue (confirmed/completed): {formatMoney(bookingRevenue)}
            </p>
          )}
        </section>

        {orders.length > 0 && (
          <section className="border border-border rounded-sm p-5 space-y-3">
            <h2 className="font-display text-lg text-ink">Orders</h2>
            <div className="space-y-3">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="block border border-border rounded-sm px-4 py-3 hover:bg-ink/5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${statusBadge(o.status)}`}>
                        {o.status.toLowerCase()}
                      </span>
                      <p className="font-meta text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
                    </div>
                    <p className="font-meta text-sm text-muted-foreground">{formatMoney(o.totalAmount)}</p>
                  </div>
                  <ul className="space-y-1">
                    {o.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-4">
                        <p className="font-meta text-xs text-muted-foreground truncate">
                          {item.photo?.title ?? item.bundle?.title ?? "Item"}
                        </p>
                        <p className="font-meta text-xs text-muted-foreground shrink-0">{formatMoney(item.price)}</p>
                      </li>
                    ))}
                  </ul>
                  {allEmails.length > 1 && (
                    <p className="font-meta text-xs text-muted-foreground/70 mt-1">{o.customerEmail}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {invoices.length > 0 && (
          <section className="border border-border rounded-sm p-5 space-y-3">
            <h2 className="font-display text-lg text-ink">Invoices</h2>
            <div className="space-y-2">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/admin/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-4 border border-border rounded-sm px-4 py-3 hover:bg-ink/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <p className="font-meta text-sm text-ink">{inv.number}</p>
                    <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${statusBadge(inv.status)}`}>
                      {inv.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="font-meta text-sm text-muted-foreground">{formatMoney(inv.amountDue)}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {inquiries.length > 0 && (
          <section className="border border-border rounded-sm p-5 space-y-3">
            <h2 className="font-display text-lg text-ink">Inquiries</h2>
            <div className="space-y-2">
              {inquiries.map((inq) => (
                <Link
                  key={inq.id}
                  href={`/admin/inquiries/${inq.id}`}
                  className="flex items-center justify-between gap-4 border border-border rounded-sm px-4 py-3 hover:bg-ink/5 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm text-ink truncate">{inq.subject}</p>
                    <div className="flex items-center gap-2">
                      <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${statusBadge(inq.status)}`}>
                        {inq.status.toLowerCase()}
                      </span>
                      <p className="font-meta text-xs text-muted-foreground">{formatDate(inq.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
