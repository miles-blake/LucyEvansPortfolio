import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { resend } from "@/lib/resend";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking Confirmed — Lucy Evans Photography" };

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ slot?: string; session_id?: string }>;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC" });
}

export default async function MiniSessionSuccessPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { slot: slotId, session_id: sessionId } = await searchParams;

  if (!slotId || !sessionId) redirect(`/mini-sessions/${id}`);

  const slot = await prisma.miniSessionSlot.findUnique({
    where: { id: slotId },
    include: { day: true },
  });

  if (!slot) redirect(`/mini-sessions/${id}`);

  // If already confirmed, just show the success page
  if (slot.status !== "booked") {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        const pi = session.payment_intent as string;

        await prisma.miniSessionSlot.update({
          where: { id: slotId },
          data: { status: "booked", heldUntil: null, stripePaymentIntentId: pi },
        });

        // Send confirmation email
        const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
        const from = process.env.RESEND_FROM_EMAIL ?? "Lucy Evans <hello@lucyevans.com>";
        try {
          await resend.emails.send({
            from,
            to: slot.clientEmail!,
            subject: `Mini session booked — ${slot.day.title}`,
            html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
              <h2 style="font-size:20px">You're booked!</h2>
              <p>Hi ${slot.clientName?.split(" ")[0] ?? "there"},</p>
              <p>Your mini session is confirmed. Here are your details:</p>
              <table style="border-collapse:collapse;width:100%;margin:16px 0">
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Session</td><td style="padding:6px 0;font-size:13px">${slot.day.title}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Date</td><td style="padding:6px 0;font-size:13px">${formatDate(slot.day.date)}</td></tr>
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Time</td><td style="padding:6px 0;font-size:13px">${formatTime(slot.startTime)}</td></tr>
                ${slot.day.location ? `<tr><td style="padding:6px 0;color:#888;font-size:13px">Location</td><td style="padding:6px 0;font-size:13px">${slot.day.location}</td></tr>` : ""}
                <tr><td style="padding:6px 0;color:#888;font-size:13px">Duration</td><td style="padding:6px 0;font-size:13px">${slot.day.duration} minutes</td></tr>
              </table>
              <p>I'll be in touch with any additional details before your session. Can't wait to work with you!</p>
              <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
            </div>`,
          });
        } catch (err) {
          console.error("[mini-session confirm] email failed:", err);
        }
      } else {
        // Payment not completed — release hold
        await prisma.miniSessionSlot.update({
          where: { id: slotId },
          data: { status: "available", heldUntil: null, clientName: null, clientEmail: null, clientPhone: null },
        });
        redirect(`/mini-sessions/${id}`);
      }
    } catch {
      redirect(`/mini-sessions/${id}`);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="mb-8">
        <div className="w-12 h-12 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sage">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="font-display text-3xl text-ink">You&apos;re booked!</h1>
        <p className="text-muted-foreground mt-3">
          A confirmation has been sent to {slot.clientEmail}.
        </p>
      </div>

      <div className="border border-border rounded-sm p-6 text-left space-y-3 mb-8">
        <div className="flex justify-between text-sm">
          <span className="font-meta text-muted-foreground">Session</span>
          <span className="text-ink">{slot.day.title}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-meta text-muted-foreground">Date</span>
          <span className="text-ink">{formatDate(slot.day.date)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-meta text-muted-foreground">Time</span>
          <span className="text-ink">{formatTime(slot.startTime)}</span>
        </div>
        {slot.day.location && (
          <div className="flex justify-between text-sm">
            <span className="font-meta text-muted-foreground">Location</span>
            <span className="text-ink">{slot.day.location}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="font-meta text-muted-foreground">Duration</span>
          <span className="text-ink">{slot.day.duration} minutes</span>
        </div>
      </div>

      <p className="font-meta text-xs text-muted-foreground">
        Questions? Reply to your confirmation email or visit{" "}
        <a href="/contact" className="text-ink underline underline-offset-2 hover:opacity-70">our contact page</a>.
      </p>
    </main>
  );
}
