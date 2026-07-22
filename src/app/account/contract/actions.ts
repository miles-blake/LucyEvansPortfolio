"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function signContract(formData: FormData) {
  const portalToken = formData.get("portalToken") as string | null;
  const contractId = formData.get("contractId") as string;
  const signedName = (formData.get("signedName") as string)?.trim();

  if (!contractId || !signedName) return { error: "Name is required." };

  let bookingEmail: string | null = null;

  if (portalToken) {
    const pt = await prisma.clientPortalToken.findUnique({
      where: { token: portalToken },
      include: { booking: { select: { customerEmail: true } } },
    });
    if (!pt || pt.expiresAt < new Date()) return { error: "Invalid portal link." };
    bookingEmail = pt.booking.customerEmail;
  } else {
    const session = await auth();
    if (!session || session.user.role !== "client") return { error: "Unauthorized." };
    bookingEmail = session.user.email ?? null;
  }

  const contract = await prisma.bookingContract.findUnique({ where: { id: contractId } });
  if (!contract || contract.signedAt) return { error: "Contract not found or already signed." };

  // Verify the contract belongs to a booking for this client
  const booking = await prisma.booking.findUnique({ where: { id: contract.bookingId } });
  if (!booking || booking.customerEmail !== bookingEmail) return { error: "Unauthorized." };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  const signedAt = new Date();
  await prisma.bookingContract.update({
    where: { id: contractId },
    data: { signedAt, signedName },
  });

  // Notify admin that the contract was signed
  try {
    const { resend } = await import("@/lib/resend");
    const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? from;
    const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
    const eventDate = booking.eventDate.toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
    });
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `Contract signed — ${booking.customerName}`,
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
        <p><strong>${signedName}</strong> has signed the contract for their ${booking.eventType} booking on ${eventDate}.</p>
        <p><a href="${siteUrl}/admin/bookings/${booking.id}" style="color:#A9C6D8">View booking →</a></p>
      </div>`,
    });
  } catch (err) {
    console.error("[contract signed notification]", err);
  }

  revalidatePath(`/portal/${portalToken ?? ""}`);
  revalidatePath("/account");
  return { success: true };
}
