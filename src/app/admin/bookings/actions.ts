"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function updateBookingStatus(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const status = formData.get("status") as "INQUIRY" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  await prisma.booking.update({ where: { id }, data: { status } });
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function saveBookingNotes(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string;
  const notes = formData.get("notes") as string;
  if (!id) return;
  await prisma.booking.update({ where: { id }, data: { message: notes } });
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

export async function createInvoiceForBooking(formData: FormData) {
  await requireAdmin();
  const bookingId = formData.get("bookingId") as string;
  const { createInvoiceFromBooking } = await import("@/app/admin/invoices/actions");
  const result = await createInvoiceFromBooking(bookingId);
  if ("error" in result && result.error) return;
  redirect(`/admin/invoices/${result.invoiceId}`);
}
