import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { resend } from "@/lib/resend";

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
  addOns: z.object({
    extraRoll: z.boolean(),
    rushDelivery: z.boolean(),
    secondShooter: z.boolean(),
  }).optional().default({ extraRoll: false, rushDelivery: false, secondShooter: false }),
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

    // Send auto-responder email to client
    try {
      const firstName = data.customerName.split(" ")[0];
      const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
      const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
      const eventDateFormatted = new Date(data.eventDate + "T12:00:00Z").toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
      });
      await resend.emails.send({
        from,
        to: data.customerEmail,
        subject: "Booking request received — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
  <p>Hi ${firstName},</p>
  <p>Thank you for reaching out! I've received your booking request and will be in touch within 1–2 business days to confirm your date. Once confirmed, you'll receive a link to your personal portal to pay your deposit and complete your booking.</p>
  <p>Here's what you submitted:</p>
  <table style="border-collapse:collapse;width:100%;margin:16px 0">
    <tr><td style="padding:6px 0;color:#888;font-size:13px">Event type</td><td style="padding:6px 0;font-size:13px;text-transform:capitalize">${data.eventType}</td></tr>
    <tr><td style="padding:6px 0;color:#888;font-size:13px">Date</td><td style="padding:6px 0;font-size:13px">${eventDateFormatted}</td></tr>
    <tr><td style="padding:6px 0;color:#888;font-size:13px">Package</td><td style="padding:6px 0;font-size:13px">${pkg.name}</td></tr>
    <tr><td style="padding:6px 0;color:#888;font-size:13px">Deposit (due on confirmation)</td><td style="padding:6px 0;font-size:13px">$${(depositAmount / 100).toFixed(2)}</td></tr>
  </table>
  <p>Questions? Just reply to this email.</p>
  <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
</div>`,
      });
    } catch (err) {
      console.error("[inquiry auto-responder]", err);
    }

    // All bookings land as INQUIRY — Lucy reviews and confirms before payment is collected
    return NextResponse.json({ bookingId: booking.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request.", issues: err.issues }, { status: 400 });
    }
    console.error("[booking] error:", err);
    return NextResponse.json({ error: "Booking failed. Please try again." }, { status: 500 });
  }
}
