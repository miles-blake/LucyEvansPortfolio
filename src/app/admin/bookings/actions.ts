"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAdminAction } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function updateBookingStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "INQUIRY" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  const prev = await prisma.booking.findUnique({
    where: { id },
    include: { package: true, portalToken: { select: { token: true } } },
  });

  await prisma.booking.update({ where: { id }, data: { status } });
  await logAdminAction("booking.status_changed", id, { from: prev?.status, to: status });

  // Send confirmation when a booking is confirmed for the first time
  if (status === "CONFIRMED" && prev && prev.status !== "CONFIRMED") {
    const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
    const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
    const eventDate = prev.eventDate.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
    const portalUrl = prev.portalToken
      ? `${siteUrl}/portal/${prev.portalToken.token}`
      : `${siteUrl}/account`;

    if (prev.communicationPreference === "sms" && prev.customerPhone) {
      const { sendSMS } = await import("@/lib/twilio");
      try {
        await sendSMS(
          prev.customerPhone,
          `Hi ${prev.customerName.split(" ")[0]}! Your ${prev.eventType} booking with Lucy Evans Photography is confirmed for ${eventDate}. View details: ${portalUrl}`
        );
      } catch (err) {
        console.error("[confirmation sms]", err);
      }
    } else {
      const { resend } = await import("@/lib/resend");
      try {
        await resend.emails.send({
          from,
          to: prev.customerEmail,
          subject: "Your booking is confirmed — Lucy Evans Photography",
          html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
            <p>Hi ${prev.customerName},</p>
            <p>Great news — your booking is confirmed! Here are your details:</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr><td style="padding:6px 0;color:#888;font-size:13px">Package</td><td style="padding:6px 0;font-size:13px">${prev.package.name}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px">Event type</td><td style="padding:6px 0;font-size:13px;text-transform:capitalize">${prev.eventType}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px">Date</td><td style="padding:6px 0;font-size:13px">${eventDate}</td></tr>
              <tr><td style="padding:6px 0;color:#888;font-size:13px">Deposit</td><td style="padding:6px 0;font-size:13px">$${(prev.depositAmount / 100).toFixed(2)}</td></tr>
            </table>
            <p>You can view full details and pay your deposit at your booking portal:</p>
            <p><a href="${portalUrl}" style="color:#A9C6D8">${portalUrl}</a></p>
            <p>Questions? Just reply to this email.</p>
            <p>— Lucy Evans<br/><a href="https://lucyevans.com" style="color:#A9C6D8">lucyevans.com</a></p>
          </div>`,
        });
      } catch (err) {
        console.error("[confirmation email]", err);
      }
    }
  }

  // Auto-generate contract if template exists and no contract yet
  if (status === "CONFIRMED" && prev && prev.status !== "CONFIRMED") {
    try {
      const [template, existingContract] = await Promise.all([
        prisma.contractTemplate.findFirst(),
        prisma.bookingContract.findFirst({ where: { bookingId: id } }),
      ]);
      if (template && !existingContract) {
        const { renderToBuffer } = await import("@react-pdf/renderer");
        const React = await import("react");
        const { ContractPDF } = await import("@/components/ContractPDF");
        const booking = await prisma.booking.findUnique({ where: { id }, include: { package: { select: { name: true } } } });
        if (booking) {
          const el = React.default.createElement(ContractPDF, { booking, templateBody: template.body }) as any;
          const buffer: Buffer = await renderToBuffer(el);
          const { cloudinary } = await import("@/lib/cloudinary");
          const pdfUrl = await new Promise<string>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { resource_type: "raw", folder: "contracts", public_id: id, format: "pdf" },
              (err, result) => { if (err || !result) return reject(err ?? new Error("Upload failed")); resolve(result.secure_url); }
            );
            stream.end(buffer);
          });
          await prisma.bookingContract.create({ data: { bookingId: id, pdfUrl } });
          const { resend } = await import("@/lib/resend");
          const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
          const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
          const portalToken = prev.portalToken;
          const portalUrl = portalToken ? `${siteUrl}/portal/${portalToken.token}` : `${siteUrl}/account`;
          await resend.emails.send({
            from,
            to: prev.customerEmail,
            subject: "Your contract is ready to sign — Lucy Evans Photography",
            html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${prev.customerName},</p>
          <p>Your booking contract is ready. Please review and sign it at your portal to complete your booking:</p>
          <p><a href="${portalUrl}" style="display:inline-block;background:#2E2A24;color:#F5F0EA;padding:10px 20px;border-radius:3px;text-decoration:none;font-size:14px">Sign your contract →</a></p>
          <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
        </div>`,
          });
        }
      }
    } catch (err) {
      console.error("[auto-contract]", err);
    }
  }

  // Send review request when booking is completed for the first time
  if (status === "COMPLETED" && prev && prev.status !== "COMPLETED") {
    const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
    const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
    try {
      let review = await prisma.review.findFirst({ where: { bookingId: id } });
      if (!review) {
        review = await prisma.review.create({
          data: {
            bookingId: id,
            clientName: prev.customerName,
            clientEmail: prev.customerEmail,
            rating: 0,
            body: "",
          },
        });
      }
      const { resend } = await import("@/lib/resend");
      await resend.emails.send({
        from,
        to: prev.customerEmail,
        subject: "How did we do? Leave a review — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${prev.customerName.split(" ")[0]},</p>
          <p>It was such a pleasure working with you! I'd love to hear about your experience — your feedback means the world and helps other clients feel confident booking.</p>
          <p><a href="${siteUrl}/reviews/${review.token}" style="display:inline-block;background:#2E2A24;color:#F5F0EA;padding:10px 20px;border-radius:3px;text-decoration:none;font-size:14px">Leave a review →</a></p>
          <p style="font-size:13px;color:#888">This link is personal to you and takes just a minute.</p>
          <p>— Lucy Evans<br/><a href="${siteUrl}" style="color:#A9C6D8">lucyevans.com</a></p>
        </div>`,
      });
    } catch (err) {
      console.error("[review request]", err);
    }
  }

  // Send cancellation notice
  if (status === "CANCELLED" && prev && prev.status !== "CANCELLED") {
    const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
    const eventDate = prev.eventDate.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
    try {
      if (prev.communicationPreference === "sms" && prev.customerPhone) {
        const { sendSMS } = await import("@/lib/twilio");
        await sendSMS(
          prev.customerPhone,
          `Hi ${prev.customerName.split(" ")[0]}, your ${prev.eventType} booking with Lucy Evans Photography on ${eventDate} has been cancelled. Please reach out if you have questions.`
        );
      } else {
        const { resend } = await import("@/lib/resend");
        await resend.emails.send({
          from,
          to: prev.customerEmail,
          subject: "Your booking has been cancelled — Lucy Evans Photography",
          html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
            <p>Hi ${prev.customerName},</p>
            <p>Your ${prev.eventType} booking on ${eventDate} has been cancelled.</p>
            <p>If you have any questions or would like to reschedule, please don't hesitate to reach out — just reply to this email.</p>
            <p>— Lucy Evans<br/><a href="${process.env.NEXTAUTH_URL ?? "https://lucyevans.com"}" style="color:#A9C6D8">lucyevans.com</a></p>
          </div>`,
        });
      }
    } catch (err) {
      console.error("[cancellation email]", err);
    }
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function sendBookingMessage(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  const body = (formData.get("body") as string)?.trim().slice(0, 4000);
  if (!bookingId || !body) return;

  await prisma.bookingMessage.create({
    data: { bookingId, senderRole: "admin", body },
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function saveBookingNotes(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string;
  if (!id) return;
  await prisma.booking.update({ where: { id }, data: { adminNotes: notes } });
  revalidatePath(`/admin/bookings/${id}`);
}

export async function sendClientPortalLink(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { customerName: true, customerEmail: true, portalToken: { select: { token: true } } },
  });
  if (!booking) return;

  // Reuse existing token or create a new one (30-day expiry)
  let token: string;
  if (booking.portalToken) {
    token = booking.portalToken.token;
    // Refresh expiry
    await prisma.clientPortalToken.update({
      where: { bookingId },
      data: { expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
  } else {
    const created = await prisma.clientPortalToken.create({
      data: {
        bookingId,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    token = created.token;
  }

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
  const portalUrl = `${siteUrl}/portal/${token}`;
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";

  const { resend } = await import("@/lib/resend");
  try {
    await resend.emails.send({
      from,
      to: booking.customerEmail,
      subject: "Your booking portal — Lucy Evans Photography",
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24"><p>Hi ${booking.customerName},</p><p>You can view your booking details, invoice, and any downloads at your personal portal:</p><p><a href="${portalUrl}" style="color:#A9C6D8">${portalUrl}</a></p><p>This link is valid for 30 days.</p><p>— Lucy Evans<br/><a href="https://lucyevans.com" style="color:#A9C6D8">lucyevans.com</a></p></div>`,
    });
  } catch (err) {
    console.error("[sendClientPortalLink]", err);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deleteBooking(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  if (!id) return;
  const booking = await prisma.booking.findUnique({ where: { id }, select: { customerName: true, customerEmail: true } });
  await prisma.booking.delete({ where: { id } });
  await logAdminAction("booking.deleted", id, { customerName: booking?.customerName, customerEmail: booking?.customerEmail });
  redirect("/admin/bookings");
}

export async function createInvoiceForBooking(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  const { createInvoiceFromBooking } = await import("@/app/admin/invoices/actions");
  const result = await createInvoiceFromBooking(bookingId);
  if ("error" in result && result.error) return;
  redirect(`/admin/invoices/${result.invoiceId}`);
}
