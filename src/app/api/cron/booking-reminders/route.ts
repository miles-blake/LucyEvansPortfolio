import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { sendSMS } from "@/lib/twilio";

// Called by Vercel Cron daily at 08:00 UTC
// vercel.json: { "crons": [{ "path": "/api/cron/booking-reminders", "schedule": "0 8 * * *" }] }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const from = process.env.RESEND_FROM_EMAIL ?? "Lucy Evans <hello@lucyevans.com>";
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";

  function dayWindow(daysFromNow: number) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() + daysFromNow);
    return {
      gte: new Date(`${d.toISOString().split("T")[0]}T00:00:00Z`),
      lt: new Date(`${d.toISOString().split("T")[0]}T23:59:59Z`),
    };
  }

  const [bookings7, bookings2] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent7Day: false,
        eventDate: dayWindow(7),
      },
      include: { package: true, portalToken: { select: { token: true } } },
    }),
    prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        reminderSent2Day: false,
        eventDate: dayWindow(2),
      },
      include: { package: true, portalToken: { select: { token: true } } },
    }),
  ]);

  let sent = 0;

  async function sendReminder(
    booking: (typeof bookings7)[0],
    daysOut: 7 | 2
  ) {
    const eventDate = booking.eventDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const portalUrl = booking.portalToken
      ? `${siteUrl}/portal/${booking.portalToken.token}`
      : `${siteUrl}/account`;

    if (booking.communicationPreference === "sms" && booking.customerPhone) {
      const depositNote = !booking.depositPaid
        ? ` Your deposit of $${(booking.depositAmount / 100).toFixed(0)} is still outstanding.`
        : "";
      await sendSMS(
        booking.customerPhone,
        `Hi ${booking.customerName.split(" ")[0]}! Reminder: your ${booking.eventType} session with Lucy Evans Photography is ${daysOut === 7 ? "next week" : "in 2 days"} on ${eventDate}.${depositNote} Details: ${portalUrl}`
      );
    } else {
      const outstandingDeposit = !booking.depositPaid;
      const depositNote = outstandingDeposit
        ? `<p style="margin:12px 0;padding:12px;background:#fef2f2;border-radius:4px;font-size:13px;color:#991b1b">⚠️ Your deposit of $${(booking.depositAmount / 100).toFixed(0)} is still outstanding. Please pay before your shoot: <a href="${portalUrl}">${portalUrl}</a></p>`
        : "";

      await resend.emails.send({
        from,
        to: booking.customerEmail,
        subject: `Your shoot is ${daysOut === 7 ? "one week" : "2 days"} away — Lucy Evans Photography`,
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${booking.customerName},</p>
          <p>Just a reminder that your <strong>${booking.eventType}</strong> session with Lucy is coming up ${daysOut === 7 ? "next week" : "in 2 days"} — <strong>${eventDate}</strong>.</p>
          ${depositNote}
          <table style="border-collapse:collapse;width:100%;margin:16px 0">
            <tr><td style="padding:6px 0;color:#888;font-size:13px">Package</td><td style="padding:6px 0;font-size:13px">${booking.package.name}</td></tr>
            <tr><td style="padding:6px 0;color:#888;font-size:13px">Date</td><td style="padding:6px 0;font-size:13px">${eventDate}</td></tr>
          </table>
          <p>View your booking details at your portal:<br/><a href="${portalUrl}" style="color:#A9C6D8">${portalUrl}</a></p>
          <p>See you soon!<br/>— Lucy Evans<br/><a href="https://lucyevans.com" style="color:#A9C6D8">lucyevans.com</a></p>
        </div>`,
      });
    }
  }

  for (const booking of bookings7) {
    try {
      await sendReminder(booking, 7);
      await prisma.booking.update({ where: { id: booking.id }, data: { reminderSent7Day: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] 7-day reminder failed for booking ${booking.id}:`, err);
    }
  }

  for (const booking of bookings2) {
    try {
      await sendReminder(booking, 2);
      await prisma.booking.update({ where: { id: booking.id }, data: { reminderSent2Day: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] 2-day reminder failed for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, checked7: bookings7.length, checked2: bookings2.length });
}
