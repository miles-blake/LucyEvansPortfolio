import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { signDownloadToken } from "@/lib/download-token";
import Stripe from "stripe";

// In Next.js App Router, the raw body is always accessible via req.text() — no bodyParser config needed

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or secret." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    // Verifies the signature — rejects tampered or replayed events
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metaType = session.metadata?.type;
    const orderId = session.metadata?.orderId;
    const bookingId = session.metadata?.bookingId;
    const invoiceId = session.metadata?.invoiceId;
    const customerEmail = session.customer_details?.email ?? "";

    // ── Invoice payment (new flow) ───────────────────────────────────
    if (metaType === "invoice" && invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: "PAID" },
      });
      return NextResponse.json({ received: true });
    }

    // ── Booking deposit (new flow via type metadata) ─────────────────
    if (metaType === "deposit" && bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          depositPaid: true,
          stripeSessionId: session.id,
        },
      });
      return NextResponse.json({ received: true });
    }

    // ── Booking deposit (legacy flow — no type metadata) ────────────
    if (!metaType && bookingId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          depositPaid: true,
          status: "CONFIRMED",
          stripeSessionId: session.id,
        },
      });

      if (customerEmail) {
        try {
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL ?? "Lucy Evans <hello@lucyevans.com>",
            to: customerEmail,
            subject: "Your booking is confirmed — Lucy Evans Photography",
            html: `
              <h2>You&rsquo;re on the books!</h2>
              <p>Your deposit has been received and your date is officially held.</p>
              <p>Lucy will be in touch within 24 hours to confirm all the details.</p>
              <p style="color:#6B6560;font-size:12px;">Lucy Evans Photography &mdash; Utah County, UT</p>
            `,
          });
        } catch (emailErr) {
          console.error("[stripe webhook] booking email failed:", emailErr);
        }
      }

      return NextResponse.json({ received: true });
    }

    // ── Digital photo order ──────────────────────────────────────────

    if (!orderId) {
      console.error("[stripe webhook] no orderId in session metadata");
      return NextResponse.json({ error: "No orderId." }, { status: 400 });
    }

    // Mark order paid and record customer email (name/phone may already be set from checkout)
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PAID",
        customerEmail: customerEmail || undefined,
        stripePaymentIntentId: session.payment_intent as string,
      },
      include: {
        items: {
          include: { photo: true, bundle: true },
        },
      },
    });

    // Generate HMAC-signed download URLs — each token is tied to a specific order item ID
    const downloadLinks = order.items.map((item) => {
      const name = item.photo?.title ?? item.bundle?.title ?? "Download";
      const token = signDownloadToken(item.id);
      const signedUrl = `${process.env.NEXTAUTH_URL}/api/download/${item.id}?token=${token}`;
      return { name, signedUrl, orderItemId: item.id };
    });

    // Store signed URLs on order items
    await Promise.all(
      downloadLinks.map(({ orderItemId, signedUrl }) =>
        prisma.orderItem.update({
          where: { id: orderItemId },
          data: { signedDownloadUrl: signedUrl },
        })
      )
    );

    // Send order confirmation + download links via Resend
    // TODO: Replace with a proper React email template
    if (customerEmail) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "Lucy Evans <hello@lucyevans.com>",
          to: customerEmail,
          subject: "Your Lucy Evans download is ready",
          html: `
            <h2>Thank you for your order!</h2>
            <p>Your download links are below. Each link expires in 30 days and can be used up to 5 times.</p>
            <ul>
              ${downloadLinks.map(({ name, signedUrl }) => `<li><a href="${signedUrl}">${name}</a></li>`).join("")}
            </ul>
            <p>You can also access your order at: <a href="${process.env.NEXTAUTH_URL}/order/${orderId}/confirmation">View order</a></p>
            <p style="color:#6B6560;font-size:12px;">Personal use only. See lucyevans.com/license for full terms.</p>
          `,
        });
      } catch (emailErr) {
        // Log but don't fail the webhook — the order is paid and links are stored
        console.error("[stripe webhook] failed to send confirmation email:", emailErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
