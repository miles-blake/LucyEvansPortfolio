import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      type: "deposit" | "invoice";
      bookingId?: string;
      invoiceId?: string;
      portalToken?: string;
    };

    const { type, bookingId, invoiceId, portalToken } = body;

    // ── Access verification ──────────────────────────────────────────────
    if (portalToken) {
      // Portal-token path: look up token, verify not expired
      const pt = await prisma.clientPortalToken.findUnique({
        where: { token: portalToken },
        include: { booking: true },
      });

      if (!pt || pt.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired portal token" }, { status: 401 });
      }

      // Verify token relates to the requested resource
      if (type === "deposit") {
        if (!bookingId || pt.bookingId !== bookingId) {
          return NextResponse.json({ error: "Token does not match booking" }, { status: 403 });
        }
      } else if (type === "invoice") {
        if (!invoiceId) {
          return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
        }
        const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!inv || inv.bookingId !== pt.bookingId) {
          return NextResponse.json({ error: "Token does not match invoice" }, { status: 403 });
        }
      }
    } else {
      // Session path: require client role
      const session = await auth();
      if (!session || session.user.role !== "client") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const email = session.user.email!;

      if (type === "deposit") {
        if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });
        const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
        if (!booking || booking.customerEmail !== email) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      } else if (type === "invoice") {
        if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
        const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!inv || inv.customerEmail !== email) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    // ── Build Stripe checkout session ────────────────────────────────────
    if (type === "deposit") {
      if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      if (booking.depositPaid) {
        return NextResponse.json({ error: "Deposit already paid" }, { status: 400 });
      }

      const cancelUrl = portalToken
        ? `${BASE_URL}/portal/${portalToken}`
        : `${BASE_URL}/account`;

      const successUrl = `${BASE_URL}/stripe/success?type=deposit&portalToken=${portalToken ?? ""}&bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: booking.depositAmount,
              product_data: {
                name: "Booking Deposit",
                description: `Deposit for ${booking.eventType} on ${booking.eventDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: "deposit", bookingId },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return NextResponse.json({ url: session.url });
    }

    if (type === "invoice") {
      if (!invoiceId) return NextResponse.json({ error: "invoiceId required" }, { status: 400 });

      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!inv) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      if (inv.amountDue <= 0 || inv.status === "PAID") {
        return NextResponse.json({ error: "Invoice is already paid or has no balance" }, { status: 400 });
      }

      const cancelUrl = portalToken
        ? `${BASE_URL}/portal/${portalToken}`
        : `${BASE_URL}/account`;

      const successUrl = `${BASE_URL}/stripe/success?type=invoice&portalToken=${portalToken ?? ""}&invoiceId=${invoiceId}&session_id={CHECKOUT_SESSION_ID}`;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: inv.amountDue,
              product_data: {
                name: `Invoice ${inv.number}`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: { type: "invoice", invoiceId },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err) {
    console.error("[stripe/checkout]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
