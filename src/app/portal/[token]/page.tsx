import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PayButton } from "@/components/PayButton";
import { VenmoPaymentFlow } from "@/components/VenmoPaymentFlow";
import { MessageThread } from "@/components/MessageThread";
import { ContractSigner } from "@/components/ContractSigner";
import { sendPortalMessage } from "@/app/account/messages/actions";
import { PortalReviewForm } from "@/components/PortalReviewForm";
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

  const [invoice, messages, assets, contract, review] = await Promise.all([
    prisma.invoice.findFirst({ where: { bookingId: booking.id } }),
    prisma.bookingMessage.findMany({ where: { bookingId: booking.id }, orderBy: { createdAt: "asc" } }),
    prisma.deliveredAsset.findMany({ where: { bookingId: booking.id }, orderBy: { createdAt: "asc" } }),
    prisma.bookingContract.findUnique({ where: { bookingId: booking.id } }),
    prisma.review.findFirst({ where: { bookingId: booking.id } }),
  ]);

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

          {!booking.depositPaid && booking.status !== "CANCELLED" && (
            <div className="mt-5 pt-4 border-t border-border space-y-4">
              <p className="font-meta text-xs text-muted-foreground">
                Deposit of {formatPrice(booking.depositAmount)} required to confirm your date.
              </p>
              <div className="space-y-3">
                <PayButton
                  type="deposit"
                  bookingId={booking.id}
                  portalToken={token}
                  label={`Pay with card — ${formatPrice(booking.depositAmount)}`}
                />
                <details className="group">
                  <summary className="cursor-pointer font-meta text-xs text-muted-foreground hover:text-ink transition-colors list-none flex items-center gap-1">
                    <span className="group-open:hidden">▸</span>
                    <span className="hidden group-open:inline">▾</span>
                    Pay with Venmo instead
                  </summary>
                  <VenmoPaymentFlow
                    bookingId={booking.id}
                    portalToken={token}
                    amount={booking.depositAmount}
                    type="deposit"
                    customerName={booking.customerName}
                  />
                </details>
              </div>
            </div>
          )}
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
              <div className="mt-4 space-y-3">
                <PayButton
                  type="invoice"
                  invoiceId={invoice.id}
                  portalToken={token}
                  label={`Pay now — ${formatPrice(invoice.amountDue)}`}
                />
                <details className="group">
                  <summary className="cursor-pointer font-meta text-xs text-muted-foreground hover:text-ink transition-colors list-none flex items-center gap-1">
                    <span className="group-open:hidden">▸</span>
                    <span className="hidden group-open:inline">▾</span>
                    Pay with Venmo instead
                  </summary>
                  <VenmoPaymentFlow
                    invoiceId={invoice.id}
                    portalToken={token}
                    amount={invoice.amountDue}
                    type="invoice"
                    customerName={booking.customerName}
                  />
                </details>
              </div>
            )}
          </section>
        )}

        {/* Contract */}
        {contract && (
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-4">Your contract</h2>
            {contract.signedAt ? (
              <p className="font-meta text-xs text-sage">
                Signed on{" "}
                {contract.signedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            ) : (
              <ContractSigner contractId={contract.id} pdfUrl={contract.pdfUrl} portalToken={token} />
            )}
          </section>
        )}

        {/* Delivery gallery */}
        {assets.length > 0 && (
          <section className="border border-border rounded-sm p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg text-ink">Your photos</h2>
              <a
                href={`/api/portal/${token}/download-all`}
                download="photos.zip"
                className="font-meta text-xs text-sky hover:opacity-70 transition-opacity border border-sky/30 px-3 py-1.5 rounded-sm"
              >
                Download all ({assets.length})
              </a>
            </div>
            <p className="font-meta text-xs text-muted-foreground mb-4">
              Click any photo to open and download it, or download all at once as a ZIP.
            </p>
            <ul className="space-y-2">
              {assets.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-sky hover:opacity-70 transition-opacity"
                  >
                    <span>↓</span>
                    <span>{a.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Review — shown after shoot is complete and review record exists */}
        {booking.status === "COMPLETED" && review && (
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-1">Leave a review</h2>
            <p className="font-meta text-xs text-muted-foreground mb-4">
              Your feedback helps other clients and means a lot to a small business.
            </p>
            <PortalReviewForm
              reviewToken={review.token}
              alreadySubmitted={review.rating > 0}
            />
          </section>
        )}

        {/* Messages */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Messages</h2>
          <MessageThread
            messages={messages}
            sendAction={sendPortalMessage as (prev: unknown, fd: FormData) => Promise<void>}
            hiddenFields={{ portalToken: token }}
            viewerRole="client"
          />
        </section>

        <p className="font-meta text-xs text-muted-foreground text-center">
          This page is private to you. Link expires {formatDate(portalToken.expiresAt)}.
        </p>
      </main>
    </div>
  );
}
