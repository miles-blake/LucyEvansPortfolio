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

  // Invoice reminder: SENT invoices with dueDate within 7 days (or already past) that haven't been reminded
  const invoiceReminderCutoff = new Date(now);
  invoiceReminderCutoff.setUTCDate(invoiceReminderCutoff.getUTCDate() + 7);

  const [bookings7, bookings2, bookingsFollowUp, bookingsPrepEmail, bookingsBalanceDue, bookingsReEngagement, invoicesForReminder] = await Promise.all([
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
    // Post-shoot follow-up: 2 days after the event, regardless of whether Lucy has marked COMPLETED yet
    prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "COMPLETED"] },
        followUpSent: false,
        eventDate: dayWindow(-2),
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        communicationPreference: true,
        eventType: true,
        portalToken: { select: { token: true } },
      },
    }),
    // Prep email: 7 days before the shoot
    prisma.booking.findMany({
      where: { status: "CONFIRMED", prepEmailSent: false, eventDate: dayWindow(7) },
      select: { id: true, customerName: true, customerEmail: true, customerPhone: true, communicationPreference: true, eventType: true, portalToken: { select: { token: true } } },
    }),
    // Balance due reminder: 7 days before, deposit not yet paid
    prisma.booking.findMany({
      where: { status: "CONFIRMED", balanceDueSent: false, depositPaid: false, eventDate: dayWindow(7) },
      select: { id: true, customerName: true, customerEmail: true, customerPhone: true, communicationPreference: true, eventType: true, depositAmount: true, totalPrice: true, eventDate: true, portalToken: { select: { token: true } } },
    }),
    // Re-engagement: ~180 days after completed shoot
    prisma.booking.findMany({
      where: { status: "COMPLETED", reEngagementSent: false, eventDate: dayWindow(-180) },
      select: { id: true, customerName: true, customerEmail: true, customerPhone: true, communicationPreference: true, eventType: true, portalToken: { select: { token: true } } },
    }),
    // Invoice payment reminders: SENT, unpaid, due within 7 days or overdue
    prisma.invoice.findMany({
      where: {
        status: "SENT",
        amountDue: { gt: 0 },
        invoiceReminderSent: false,
        dueDate: { lte: invoiceReminderCutoff },
      },
      select: { id: true, number: true, customerName: true, customerEmail: true, amountDue: true, dueDate: true },
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

  // Post-shoot follow-ups
  for (const booking of bookingsFollowUp) {
    try {
      const firstName = booking.customerName.split(" ")[0];
      const portalUrl = booking.portalToken
        ? `${siteUrl}/portal/${booking.portalToken.token}`
        : `${siteUrl}/account`;

      // Create a review record (if one doesn't already exist for this booking)
      let reviewToken: string | null = null;
      const existing = await prisma.review.findFirst({ where: { bookingId: booking.id } });
      if (existing) {
        reviewToken = existing.token;
      } else {
        const review = await prisma.review.create({
          data: {
            bookingId: booking.id,
            clientName: booking.customerName,
            clientEmail: booking.customerEmail,
            rating: 0,
            body: "",
          },
        });
        reviewToken = review.token;
      }

      const reviewUrl = `${siteUrl}/reviews/${reviewToken}`;

      if (booking.communicationPreference === "sms" && booking.customerPhone) {
        await sendSMS(
          booking.customerPhone,
          `Hi ${firstName}! Thanks so much for your ${booking.eventType} session with Lucy Evans Photography. Your photos are being processed — watch your inbox! In the meantime, we'd love a quick review: ${reviewUrl}`
        );
      } else {
        await resend.emails.send({
          from,
          to: booking.customerEmail,
          subject: "Thank you for your session — Lucy Evans Photography",
          html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
            <p>Hi ${firstName},</p>
            <p>Thank you so much for your <strong>${booking.eventType}</strong> session! It was an absolute pleasure working with you.</p>
            <p>Your photos are currently being processed and you'll hear from Lucy as soon as they're ready. You can check your booking status anytime at your portal:</p>
            <p><a href="${portalUrl}" style="color:#A9C6D8">${portalUrl}</a></p>
            <p style="margin-top:24px">In the meantime, Lucy would love to know how your experience was. It only takes a minute and means the world:</p>
            <p><a href="${reviewUrl}" style="display:inline-block;background:#2E2A24;color:#F5F0EA;padding:10px 20px;border-radius:3px;text-decoration:none;font-size:14px">Leave a review →</a></p>
            <p style="font-size:13px;color:#888">This link is personal to you.</p>
            <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
          </div>`,
        });
      }

      await prisma.booking.update({ where: { id: booking.id }, data: { followUpSent: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] post-shoot follow-up failed for booking ${booking.id}:`, err);
    }
  }

  // Prep email loop
  for (const booking of bookingsPrepEmail) {
    try {
      const firstName = booking.customerName.split(" ")[0];
      const portalUrl = booking.portalToken
        ? `${siteUrl}/portal/${booking.portalToken.token}`
        : `${siteUrl}/account`;
      await resend.emails.send({
        from,
        to: booking.customerEmail,
        subject: "Get ready for your shoot — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${firstName},</p>
          <p>Your <strong>${booking.eventType}</strong> shoot is just one week away — how exciting! Here are a few tips to make the most of your session:</p>
          <ul style="padding-left:20px;color:#2E2A24;font-size:14px;line-height:1.8">
            <li>Plan your outfits ahead of time — solids and neutrals photograph beautifully</li>
            <li>Get a good night's sleep the night before</li>
            <li>Bring any props or meaningful items you'd like in your photos</li>
            <li>Don't stress — just show up and have fun!</li>
          </ul>
          <p>You can review your booking details at your portal anytime:<br/><a href="${portalUrl}" style="color:#A9C6D8">${portalUrl}</a></p>
          <p>See you soon!<br/>— Lucy Evans</p>
        </div>`,
      });
      await prisma.booking.update({ where: { id: booking.id }, data: { prepEmailSent: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] prep email failed for booking ${booking.id}:`, err);
    }
  }

  // Balance due reminder loop
  for (const booking of bookingsBalanceDue) {
    try {
      const firstName = booking.customerName.split(" ")[0];
      const portalUrl = booking.portalToken
        ? `${siteUrl}/portal/${booking.portalToken.token}`
        : `${siteUrl}/account`;
      const balanceFormatted = ((booking.totalPrice - booking.depositAmount) / 100).toFixed(2);
      const eventDateFormatted = new Date(booking.eventDate ?? Date.now()).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
      });
      await resend.emails.send({
        from,
        to: booking.customerEmail,
        subject: "Balance due reminder — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${firstName},</p>
          <p>Just a friendly reminder that your remaining balance of <strong>$${balanceFormatted}</strong> is due before your <strong>${booking.eventType}</strong> session on ${eventDateFormatted}.</p>
          <p>You can pay easily at your portal:<br/><a href="${portalUrl}" style="display:inline-block;background:#2E2A24;color:#F5F0EA;padding:10px 20px;border-radius:3px;text-decoration:none;font-size:14px">Pay balance →</a></p>
          <p>Questions? Just reply to this email.<br/>— Lucy Evans</p>
        </div>`,
      });
      await prisma.booking.update({ where: { id: booking.id }, data: { balanceDueSent: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] balance due reminder failed for booking ${booking.id}:`, err);
    }
  }

  // Re-engagement loop
  for (const booking of bookingsReEngagement) {
    try {
      const firstName = booking.customerName.split(" ")[0];
      await resend.emails.send({
        from,
        to: booking.customerEmail,
        subject: "It's been 6 months — let's shoot again! — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${firstName},</p>
          <p>It's hard to believe it's been 6 months since your ${booking.eventType} session! I hope you're still loving your photos.</p>
          <p>If you've been thinking about booking another session — a new season, a special occasion, or just because — I'd love to work with you again. Reply to this email or <a href="${siteUrl}/services/book" style="color:#A9C6D8">book online</a>.</p>
          <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
        </div>`,
      });
      await prisma.booking.update({ where: { id: booking.id }, data: { reEngagementSent: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] re-engagement failed for booking ${booking.id}:`, err);
    }
  }

  // Invoice payment reminders
  for (const invoice of invoicesForReminder) {
    try {
      const firstName = invoice.customerName.split(" ")[0];
      const isOverdue = invoice.dueDate && invoice.dueDate < now;
      const dueDateFormatted = invoice.dueDate
        ? invoice.dueDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" })
        : null;

      await resend.emails.send({
        from,
        to: invoice.customerEmail,
        subject: `${isOverdue ? "Overdue" : "Payment due soon"}: Invoice ${invoice.number} — Lucy Evans Photography`,
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${firstName},</p>
          <p>${isOverdue
            ? `Your invoice <strong>${invoice.number}</strong> for <strong>$${(invoice.amountDue / 100).toFixed(2)}</strong> was due on ${dueDateFormatted} and is now overdue.`
            : `Just a reminder that your invoice <strong>${invoice.number}</strong> for <strong>$${(invoice.amountDue / 100).toFixed(2)}</strong> is due on ${dueDateFormatted}.`
          }</p>
          <p>Please log in to your booking portal to pay, or reply to this email if you have any questions.</p>
          <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
        </div>`,
      });
      await prisma.invoice.update({ where: { id: invoice.id }, data: { invoiceReminderSent: true } });
      sent++;
    } catch (err) {
      console.error(`[cron] invoice reminder failed for invoice ${invoice.id}:`, err);
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    checked7: bookings7.length,
    checked2: bookings2.length,
    checkedFollowUp: bookingsFollowUp.length,
    checkedPrepEmail: bookingsPrepEmail.length,
    checkedBalanceDue: bookingsBalanceDue.length,
    checkedReEngagement: bookingsReEngagement.length,
    checkedInvoiceReminders: invoicesForReminder.length,
  });
}
