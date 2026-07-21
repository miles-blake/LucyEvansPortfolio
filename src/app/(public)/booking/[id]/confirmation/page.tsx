import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckCircle, Clock, Mail } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Request Received",
  robots: { index: false },
};

function formatPrice(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US")}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { package: true },
  });

  if (!booking) notFound();

  const addOns = (booking.addOns ?? {}) as Record<string, number>;
  const addOnLabels: Record<string, string> = {
    extraRoll: "Extra roll",
    rushDelivery: "Rush delivery",
    secondShooter: "Second shooter",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      {/* Status icon */}
      <div className="flex items-center gap-3 mb-8">
        {booking.depositPaid ? (
          <CheckCircle className="text-sage" size={28} />
        ) : (
          <Clock className="text-sky" size={28} />
        )}
        <div>
          <h1 className="font-display text-2xl text-ink">
            {booking.depositPaid ? "Booking confirmed!" : "Inquiry received"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {booking.depositPaid
              ? "Your deposit is paid and your date is held."
              : "Your deposit payment is being processed. Your date will be held once it clears."}
          </p>
        </div>
      </div>

      {/* Booking details card */}
      <div className="border border-border rounded-sm p-6 mb-8 space-y-4">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Package</dt>
            <dd className="font-display text-ink">{booking.package.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Event type</dt>
            <dd className="text-ink capitalize">{booking.eventType}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="text-ink">{formatDate(booking.eventDate)}</dd>
          </div>

          {Object.entries(addOns).map(([key, price]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-muted-foreground">{addOnLabels[key] ?? key}</dt>
              <dd className="font-meta">{formatPrice(price)}</dd>
            </div>
          ))}

          <div className="border-t border-border pt-3 flex justify-between">
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-meta">{formatPrice(booking.totalPrice)}</dd>
          </div>
          <div className="flex justify-between font-medium">
            <dt className="text-ink">
              Deposit {booking.depositPaid ? "paid" : "due"}
            </dt>
            <dd className="font-meta text-ink">{formatPrice(booking.depositAmount)}</dd>
          </div>
          {!booking.depositPaid && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Remaining balance</dt>
              <dd className="font-meta">
                {formatPrice(booking.totalPrice - booking.depositAmount)} — due before shoot
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* What happens next */}
      <div className="bg-sky/10 border border-sky/20 rounded-sm p-5 mb-8">
        <div className="flex gap-3">
          <Mail className="text-sky shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-display text-ink mb-1">What happens next</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A confirmation email is on its way to <strong>{booking.customerEmail}</strong>.
              Lucy will reach out within 24 hours to discuss location, timing, and any other details.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 bg-ink text-cream text-sm px-5 py-2.5 rounded-sm hover:opacity-80 transition-opacity"
        >
          Browse the gallery
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-border text-ink text-sm px-5 py-2.5 rounded-sm hover:border-sky/40 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
