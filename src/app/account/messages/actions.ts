"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

const LUCY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL ?? process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";

async function notifyAdminOfClientMessage(bookingId: string, clientName: string, body: string) {
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
  try {
    const { resend } = await import("@/lib/resend");
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Lucy Evans <hello@lucyevans.com>",
      to: LUCY_EMAIL,
      subject: `New message from ${clientName}`,
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
        <p><strong>${clientName}</strong> sent you a message on their booking portal:</p>
        <blockquote style="border-left:3px solid #e5e1dc;margin:12px 0;padding:8px 16px;color:#555">${body}</blockquote>
        <p><a href="${siteUrl}/admin/bookings/${bookingId}" style="color:#A9C6D8">View booking →</a></p>
      </div>`,
    });
  } catch (err) {
    console.error("[notifyAdminOfClientMessage]", err);
  }
}

export async function sendClientMessage(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "client") throw new Error("Unauthorized");

  const bookingId = formData.get("bookingId") as string;
  const body = (formData.get("body") as string)?.trim().slice(0, 4000);
  if (!bookingId || !body) return;

  // Verify this booking belongs to the client
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.customerEmail !== session.user.email) return;

  await prisma.bookingMessage.create({
    data: { bookingId, senderRole: "client", body },
  });

  await notifyAdminOfClientMessage(bookingId, booking.customerName, body);

  revalidatePath("/account");
}

export async function sendPortalMessage(formData: FormData) {
  const portalToken = formData.get("portalToken") as string;
  const body = (formData.get("body") as string)?.trim().slice(0, 4000);
  if (!portalToken || !body) return;

  const pt = await prisma.clientPortalToken.findUnique({
    where: { token: portalToken },
    select: {
      bookingId: true,
      expiresAt: true,
      booking: { select: { customerName: true } },
    },
  });
  if (!pt || pt.expiresAt < new Date()) return;

  await prisma.bookingMessage.create({
    data: { bookingId: pt.bookingId, senderRole: "client", body },
  });

  await notifyAdminOfClientMessage(pt.bookingId, pt.booking.customerName, body);

  revalidatePath(`/portal/${portalToken}`);
}
