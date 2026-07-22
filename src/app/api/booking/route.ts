import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  packageId: z.string().min(1),
  eventType: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  communicationPreference: z.enum(["email", "sms"]).default("email"),
  message: z.string().optional(),
  referralSource: z.string().optional(),
  questionnaireAnswers: z.record(z.string(), z.string()).optional(),
  paymentMethod: z.enum(["stripe", "venmo"]).default("stripe"),
  addOns: z.object({
    extraRoll: z.boolean(),
    rushDelivery: z.boolean(),
    secondShooter: z.boolean(),
  }),
});

export async function POST(req: NextRequest) {
  const { limited } = await rateLimit(req, "booking");
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes before trying again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Re-fetch package server-side — never trust client-sent prices
    const pkg = await prisma.servicePackage.findUnique({ where: { id: data.packageId } });
    if (!pkg) {
      return NextResponse.json({ error: "Package not found." }, { status: 404 });
    }

    if (!pkg.eventTypes.includes(data.eventType)) {
      return NextResponse.json({ error: "Invalid event type for this package." }, { status: 400 });
    }

    // Validate date is not already booked
    const eventDateObj = new Date(data.eventDate + "T12:00:00Z");
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        eventDate: {
          gte: new Date(data.eventDate + "T00:00:00Z"),
          lt: new Date(data.eventDate + "T23:59:59Z"),
        },
        status: { in: ["INQUIRY", "CONFIRMED"] },
      },
    });
    if (conflictingBooking) {
      return NextResponse.json({ error: "That date is unavailable. Please choose another date." }, { status: 409 });
    }

    // Calculate total with add-ons
    const addOnPricing = (pkg.addOnPricing ?? {}) as Record<string, number>;
    let totalPrice = pkg.basePrice;
    const selectedAddOns: Record<string, number> = {};

    if (data.addOns.extraRoll && addOnPricing.extraRollPrice) {
      totalPrice += addOnPricing.extraRollPrice;
      selectedAddOns.extraRoll = addOnPricing.extraRollPrice;
    }
    if (data.addOns.rushDelivery && addOnPricing.rushDeliveryPrice) {
      totalPrice += addOnPricing.rushDeliveryPrice;
      selectedAddOns.rushDelivery = addOnPricing.rushDeliveryPrice;
    }
    if (data.addOns.secondShooter && addOnPricing.secondShooterPrice) {
      totalPrice += addOnPricing.secondShooterPrice;
      selectedAddOns.secondShooter = addOnPricing.secondShooterPrice;
    }

    const depositAmount = Math.round(totalPrice * 0.5);

    // Create booking record
    const booking = await prisma.booking.create({
      data: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone ?? null,
        communicationPreference: data.communicationPreference,
        eventDate: eventDateObj,
        eventType: data.eventType,
        packageId: data.packageId,
        addOns: Object.keys(selectedAddOns).length > 0 ? selectedAddOns : Prisma.JsonNull,
        message: data.message ?? null,
        referralSource: data.referralSource ?? null,
        questionnaireAnswers: data.questionnaireAnswers && Object.keys(data.questionnaireAnswers).length > 0
          ? data.questionnaireAnswers as Prisma.InputJsonValue
          : Prisma.JsonNull,
        status: "INQUIRY",
        depositAmount,
        depositPaid: false,
        totalPrice,
      },
    });

    // Venmo path — skip Stripe, return bookingId for inline payment flow
    if (data.paymentMethod === "venmo") {
      return NextResponse.json({ bookingId: booking.id, depositAmount, venmo: true });
    }

    // Stripe path
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: depositAmount,
            product_data: {
              name: `${pkg.name} — Booking Deposit`,
              description: `50% deposit for ${data.eventType} session on ${data.eventDate}. Remaining balance due before shoot.`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { bookingId: booking.id },
      customer_email: data.customerEmail,
      success_url: `${process.env.NEXTAUTH_URL}/booking/${booking.id}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/services/book?package=${data.packageId}&cancelled=1`,
    });

    await prisma.booking.update({ where: { id: booking.id }, data: { stripeSessionId: session.id } });

    return NextResponse.json({ url: session.url, bookingId: booking.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request.", issues: err.issues }, { status: 400 });
    }
    console.error("[booking] error:", err);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}
