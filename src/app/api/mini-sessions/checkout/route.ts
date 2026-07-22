import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { slotId, name, email, phone } = await req.json();

  if (!slotId || !name || !email) {
    return NextResponse.json({ error: "Slot, name, and email are required." }, { status: 400 });
  }

  const slot = await prisma.miniSessionSlot.findUnique({
    where: { id: slotId },
    include: { day: true },
  });

  if (!slot) {
    return NextResponse.json({ error: "Slot not found." }, { status: 404 });
  }

  // Release expired holds
  const isHeldByOther =
    slot.status === "held" &&
    slot.heldUntil &&
    slot.heldUntil > new Date();

  if (slot.status === "booked") {
    return NextResponse.json({ error: "This slot has already been booked. Please choose another." }, { status: 409 });
  }

  if (isHeldByOther) {
    return NextResponse.json({ error: "This slot is temporarily held by another customer. Please try again in a few minutes or choose another slot." }, { status: 409 });
  }

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";

  // Hold the slot for 30 minutes
  await prisma.miniSessionSlot.update({
    where: { id: slotId },
    data: {
      status: "held",
      heldUntil: new Date(Date.now() + 30 * 60 * 1000),
      clientName: name,
      clientEmail: email,
      clientPhone: phone || null,
    },
  });

  const day = slot.day;
  const slotLabel = slot.startTime.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true, timeZone: "UTC",
  });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: day.price,
            product_data: {
              name: `${day.title} — ${slotLabel}`,
              description: `${day.duration}-minute mini session · ${day.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        slotId,
        clientName: name,
        clientEmail: email,
        clientPhone: phone || "",
      },
      success_url: `${siteUrl}/mini-sessions/${day.id}/success?slot=${slotId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/mini-sessions/${day.id}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Release hold if Stripe session creation fails
    await prisma.miniSessionSlot.update({
      where: { id: slotId },
      data: { status: "available", heldUntil: null, clientName: null, clientEmail: null, clientPhone: null },
    });
    const msg = err instanceof Error ? err.message : "Checkout failed.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
