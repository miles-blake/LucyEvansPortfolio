import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { updateBookingStatus, saveBookingNotes, createInvoiceForBooking, sendClientPortalLink, sendBookingMessage } from "../actions";
import { deleteDeliveredAsset, uploadContract, deleteContract } from "../delivery-actions";
import { DeleteBookingButton } from "./DeleteBookingButton";
import { MessageThread } from "@/components/MessageThread";
import { DeliveryGalleryUpload } from "@/components/admin/DeliveryGalleryUpload";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, select: { customerName: true } });
  if (!booking) return {};
  return { title: `Booking — ${booking.customerName}` };
}

const STATUS_OPTIONS = ["INQUIRY", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function BookingDetailPage({ params }: Props) {
  const { id } = await params;
  const [booking, existingInvoice, messages, assets, contract] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: { package: true, portalToken: { select: { token: true, expiresAt: true } } },
    }),
    prisma.invoice.findFirst({ where: { bookingId: id }, select: { id: true, number: true } }),
    prisma.bookingMessage.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" } }),
    prisma.deliveredAsset.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" } }),
    prisma.bookingContract.findUnique({ where: { bookingId: id } }),
  ]);

  if (!booking) notFound();

  // Parse add-ons JSON if present
  type AddOn = { name: string; price: number };
  let addOns: AddOn[] = [];
  if (booking.addOns) {
    try {
      const parsed = booking.addOns as unknown;
      if (Array.isArray(parsed)) addOns = parsed as AddOn[];
    } catch {
      // ignore parse errors
    }
  }

  return (
    <div className="max-w-3xl">
      {/* Back link */}
      <Link
        href="/admin/bookings"
        className="inline-flex items-center gap-2 font-meta text-muted-foreground hover:text-ink transition-colors text-sm mb-6"
      >
        <ArrowLeft size={14} /> All bookings
      </Link>

      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl text-ink">{booking.customerName}</h1>
          <p className="font-meta text-sm text-muted-foreground mt-1">
            Booking created {formatDate(booking.createdAt)}
          </p>
        </div>
        <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
          booking.status === "CONFIRMED" ? "bg-sage/20 text-sage" :
          booking.status === "INQUIRY" ? "bg-sky/20 text-sky" :
          booking.status === "COMPLETED" ? "bg-ink/10 text-ink" :
          "bg-blush/30 text-rose"
        }`}>
          {booking.status.toLowerCase()}
        </span>
      </div>

      <div className="space-y-6">
        {/* Customer info */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Customer</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            <dt className="font-meta text-sm text-muted-foreground">Name</dt>
            <dd className="text-sm text-ink">{booking.customerName}</dd>
            <dt className="font-meta text-sm text-muted-foreground">Email</dt>
            <dd className="text-sm text-ink">{booking.customerEmail}</dd>
            {booking.customerPhone && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Phone</dt>
                <dd className="text-sm text-ink">{booking.customerPhone}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Event info */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Event</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            <dt className="font-meta text-sm text-muted-foreground">Date</dt>
            <dd className="text-sm text-ink">{formatDate(booking.eventDate)}</dd>
            <dt className="font-meta text-sm text-muted-foreground">Type</dt>
            <dd className="text-sm text-ink">{booking.eventType}</dd>
            <dt className="font-meta text-sm text-muted-foreground">Package</dt>
            <dd className="text-sm text-ink">{booking.package.name}</dd>
            {booking.package.rollsIncluded != null && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Rolls included</dt>
                <dd className="text-sm text-ink">{booking.package.rollsIncluded}</dd>
              </>
            )}
            {booking.package.photosIncluded != null && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Photos included</dt>
                <dd className="text-sm text-ink">{booking.package.photosIncluded}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Add-ons */}
        {addOns.length > 0 && (
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-4">Add-ons</h2>
            <ul className="space-y-2">
              {addOns.map((addon, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <span className="text-ink">{addon.name}</span>
                  <span className="font-meta text-muted-foreground">{formatPrice(addon.price)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Pricing */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Pricing</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3">
            <dt className="font-meta text-sm text-muted-foreground">Total price</dt>
            <dd className="text-sm text-ink">{formatPrice(booking.totalPrice)}</dd>
            <dt className="font-meta text-sm text-muted-foreground">Deposit amount</dt>
            <dd className="text-sm text-ink">{formatPrice(booking.depositAmount)}</dd>
            <dt className="font-meta text-sm text-muted-foreground">Deposit status</dt>
            <dd>
              <span className={`font-meta text-xs px-2 py-0.5 rounded-sm ${
                booking.depositPaid ? "bg-sage/20 text-sage" : "bg-blush/30 text-rose"
              }`}>
                {booking.depositPaid ? "Paid" : "Unpaid"}
              </span>
            </dd>
            {booking.stripeSessionId && (
              <>
                <dt className="font-meta text-sm text-muted-foreground">Stripe session</dt>
                <dd className="text-sm text-ink font-meta truncate">{booking.stripeSessionId}</dd>
              </>
            )}
          </dl>
        </section>

        {/* Message */}
        {booking.message && (
          <section className="border border-border rounded-sm p-6">
            <h2 className="font-display text-lg text-ink mb-4">Message from customer</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{booking.message}</p>
          </section>
        )}

        {/* Notes (editable) */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Notes</h2>
          <form action={saveBookingNotes} className="space-y-3">
            <input type="hidden" name="id" value={booking.id} />
            <textarea
              name="notes"
              defaultValue={booking.message ?? ""}
              rows={4}
              placeholder="Internal notes about this booking…"
              className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-sky/40 resize-none"
            />
            <button
              type="submit"
              className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta"
            >
              Save notes
            </button>
          </form>
        </section>

        {/* Status */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Update status</h2>
          <form action={updateBookingStatus} className="flex items-center gap-3">
            <input type="hidden" name="id" value={booking.id} />
            <select
              name="status"
              defaultValue={booking.status}
              className="text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-sky/40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.toLowerCase()}</option>
              ))}
            </select>
            <button
              type="submit"
              className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta"
            >
              Save
            </button>
          </form>
        </section>

        {/* Email customer */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Email customer</h2>
          <Link
            href={`/admin/email?to=${encodeURIComponent(booking.customerEmail)}&subject=${encodeURIComponent(`Re: your ${booking.eventType} booking`)}`}
            className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors inline-flex"
          >
            Compose email →
          </Link>
        </section>

        {/* Invoice */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Invoice</h2>
          {existingInvoice ? (
            <Link
              href={`/admin/invoices/${existingInvoice.id}`}
              className="font-meta text-sm text-sky hover:opacity-70 transition-opacity"
            >
              {existingInvoice.number} — View invoice →
            </Link>
          ) : (
            <form action={createInvoiceForBooking}>
              <input type="hidden" name="bookingId" value={booking.id} />
              <button
                type="submit"
                className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta"
              >
                Create invoice
              </button>
            </form>
          )}
        </section>
        {/* Delivery gallery */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Delivery gallery</h2>
          <p className="font-meta text-xs text-muted-foreground mb-4">
            Upload edited photos here — the client will be able to download them from their portal.
          </p>
          {assets.length > 0 && (
            <ul className="space-y-2 mb-4">
              {assets.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <a href={a.url} target="_blank" rel="noopener noreferrer"
                    className="text-sky hover:opacity-70 truncate">{a.name}</a>
                  <form action={deleteDeliveredAsset}>
                    <input type="hidden" name="id" value={a.id} />
                    <input type="hidden" name="publicId" value={a.publicId} />
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button type="submit" className="font-meta text-xs text-muted-foreground hover:text-rose-500 transition-colors whitespace-nowrap">
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <DeliveryGalleryUpload bookingId={booking.id} />
        </section>

        {/* Contract */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Contract</h2>
          {contract ? (
            <div className="space-y-3">
              <a href={contract.pdfUrl} target="_blank" rel="noopener noreferrer"
                className="font-meta text-xs text-sky hover:opacity-70">
                View contract PDF →
              </a>
              {contract.signedAt ? (
                <p className="font-meta text-xs text-sage">
                  Signed by {contract.signedName} on{" "}
                  {contract.signedAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              ) : (
                <p className="font-meta text-xs text-muted-foreground">Not yet signed by client.</p>
              )}
              <form action={deleteContract}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button type="submit" className="font-meta text-xs text-muted-foreground hover:text-rose-500 transition-colors">
                  Remove contract
                </button>
              </form>
            </div>
          ) : (
            <form action={uploadContract} className="space-y-3">
              <input type="hidden" name="bookingId" value={booking.id} />
              <div>
                <label className="font-meta text-xs text-muted-foreground block mb-1">Contract PDF URL</label>
                <input name="pdfUrl" type="url" required placeholder="https://…"
                  className="w-full text-sm border border-border rounded-sm px-3 py-2 bg-cream text-ink focus:outline-none focus:ring-1 focus:ring-ink/30" />
                <p className="font-meta text-[11px] text-muted-foreground mt-1">
                  Paste a link to the contract — Google Drive, Dropbox, or any direct PDF URL.
                </p>
              </div>
              <button type="submit" className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta">
                Attach contract
              </button>
            </form>
          )}
        </section>

        {/* Messages */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Messages</h2>
          <MessageThread
            messages={messages}
            sendAction={sendBookingMessage as (prev: unknown, fd: FormData) => Promise<void>}
            hiddenFields={{ bookingId: booking.id }}
            viewerRole="admin"
          />
        </section>

        {/* Client portal */}
        <section className="border border-border rounded-sm p-6">
          <h2 className="font-display text-lg text-ink mb-4">Client portal</h2>
          {booking.portalToken ? (
            <div className="space-y-2">
              <p className="font-meta text-xs text-muted-foreground">
                Link active · expires {formatDate(booking.portalToken.expiresAt)}
              </p>
              <div className="flex items-center gap-3">
                <form action={sendClientPortalLink}>
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <button type="submit" className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta">
                    Resend portal link
                  </button>
                </form>
                <Link
                  href={`/portal/${booking.portalToken.token}`}
                  target="_blank"
                  className="border border-border text-muted-foreground px-3 py-1.5 rounded-sm text-xs font-meta hover:text-ink transition-colors"
                >
                  Preview portal →
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Send the client a personal link to view their booking and invoice.</p>
              <form action={sendClientPortalLink}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button type="submit" className="text-xs bg-ink text-cream px-3 py-1.5 rounded-sm hover:opacity-80 transition-opacity font-meta">
                  Send portal link
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section className="border border-rose-200 rounded-sm p-6">
          <h2 className="font-display text-lg text-rose-600 mb-2">Delete booking</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently removes this booking along with all messages, delivered assets, contract, and portal token. This cannot be undone.
          </p>
          <DeleteBookingButton bookingId={booking.id} />
        </section>
      </div>
    </div>
  );
}
