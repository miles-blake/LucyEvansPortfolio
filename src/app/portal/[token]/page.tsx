import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const pt = await prisma.clientPortalToken.findUnique({
    where: { token },
    select: { booking: { select: { customerName: true } } },
  });
  if (!pt) return { title: "Booking Portal" };
  return { title: `Booking Portal — ${pt.booking.customerName}` };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_LABEL: Record<string, string> = {
  INQUIRY: "We've received your request and will be in touch shortly.",
  CONFIRMED: "Your booking is confirmed!",
  COMPLETED: "Shoot complete — thank you!",
  CANCELLED: "This booking has been cancelled.",
};

export default async function ClientPortalPage({ params }: Props) {
  const { token } = await params;

  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { token },
    include: {
      booking: {
        include: {
          package: true,
          portalToken: false,
        },
      },
    },
  });

  if (!portalToken || portalToken.expiresAt < new Date()) notFound();

  const booking = portalToken.booking;

  // Find any invoice linked to this booking
  const invoice = await prisma.invoice.findFirst({
    where: { bookingId: booking.id },
  });

  type LineItem = { description: string; amount: number };
  const lineItems = invoice ? (invoice.lineItems as LineItem[]) : [];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="border-b border-border py-5 px-6">
        <p className="font-display text-lg text-ink">Lucy Evans Photography</p>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Hi, {booking.customerName.split(" ")[0]}.</h1>
          <p className="text-muted-foreground mt-2">{STATUS_LABEL[booking.status] ?? ""}</p>
        </div>

        {/* Booking details */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Your booking</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <dt className="font-meta text-muted-foreground">Package</dt>
            <dd className="text-ink">{booking.package.name}</dd>
            <dt className="font-meta text-muted-foreground">Event type</dt>
            <dd className="text-ink capitalize">{booking.eventType}</dd>
            <dt className="font-meta text-muted-foreground">Date</dt>
            <dd className="text-ink">{formatDate(booking.eventDate)}</dd>
            <dt className="font-meta text-muted-foreground">Status</dt>
            <dd>
              <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                booking.status === "CONFIRMED" ? "bg-sage/20 text-sage" :
                booking.status === "INQUIRY" ? "bg-sky/20 text-sky" :
                booking.status === "COMPLETED" ? "bg-ink/10 text-ink" :
                "bg-rose/20 text-rose"
              }`}>
                {booking.status.toLowerCase()}
              </span>
            </dd>
          </dl>
        </section>

        {/* Invoice */}
        {invoice && (
          <section className="border border-border rounded-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg text-ink">Invoice {invoice.number}</h2>
              <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                invoice.status === "PAID" ? "bg-sage/20 text-sage" :
                invoice.status === "SENT" ? "bg-sky/20 text-sky" :
                "bg-ink/10 text-ink"
              }`}>
                {invoice.status.toLowerCase()}
              </span>
            </div>

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

            <div className="border-t border-border pt-3 space-y-1.5">
              {invoice.depositPaid > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="font-meta text-muted-foreground">Deposit paid</span>
                  <span className="text-sage">−{formatPrice(invoice.depositPaid)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-medium">
                <span className="text-ink">Amount due</span>
                <span className="font-display text-ink">{formatPrice(invoice.amountDue)}</span>
              </div>
              {invoice.dueDate && (
                <p className="font-meta text-xs text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
              )}
            </div>

            {invoice.amountDue > 0 && invoice.status !== "PAID" && (
              <p className="font-meta text-xs text-muted-foreground mt-4">
                To pay your balance, please contact{" "}
                <a href="mailto:hello@lucyevans.com" className="text-sky hover:opacity-70">
                  hello@lucyevans.com
                </a>
                .
              </p>
            )}
          </section>
        )}

        {/* Contact */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-2">Questions?</h2>
          <p className="text-sm text-muted-foreground">
            Reach out any time at{" "}
            <a href="mailto:hello@lucyevans.com" className="text-sky hover:opacity-70">
              hello@lucyevans.com
            </a>
            .
          </p>
        </section>

        <p className="font-meta text-xs text-muted-foreground text-center">
          This page is private to you. Link expires {formatDate(portalToken.expiresAt)}.
        </p>
      </main>
    </div>
  );
}
