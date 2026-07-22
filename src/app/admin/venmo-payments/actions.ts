"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";
import { resend } from "@/lib/resend";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function confirmVenmoPayment(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const file = formData.get("adminProof") as File | null;

  if (!file || file.size === 0) throw new Error("Admin proof screenshot is required.");

  // Upload Lucy's confirmation screenshot
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "venmo-proofs/admin", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result as { secure_url: string });
      }
    ).end(buffer);
  });

  const payment = await prisma.venmoPayment.update({
    where: { id },
    data: { status: "confirmed", adminProofUrl: uploadResult.secure_url },
    include: { booking: true },
  });

  // Mark deposit as paid on the booking
  if (payment.type === "deposit") {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { depositPaid: true },
    });
  }

  // Notify client
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  const dollars = (payment.amount / 100).toFixed(2);

  const portalToken = await prisma.clientPortalToken.findUnique({
    where: { bookingId: payment.bookingId },
    select: { token: true },
  });

  try {
    await resend.emails.send({
      from,
      to: payment.booking.customerEmail,
      subject: "Payment confirmed — Lucy Evans Photography",
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
        <p>Hi ${payment.booking.customerName.split(" ")[0]},</p>
        <p>Your Venmo payment of <strong>$${dollars}</strong> has been confirmed. Your booking ${payment.type === "deposit" ? "deposit is now paid" : "is updated"}.</p>
        ${portalToken ? `<p><a href="${siteUrl}/portal/${portalToken.token}" style="color:#A9C6D8">View your booking portal →</a></p>` : ""}
        <p>— Lucy Evans</p>
      </div>`,
    });
  } catch (err) {
    console.error("[venmo confirm] client email failed:", err);
  }

  revalidatePath("/admin/venmo-payments");
  revalidatePath(`/admin/bookings/${payment.bookingId}`);
}

export async function rejectVenmoPayment(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const note = (formData.get("note") as string) || "Payment could not be verified.";

  const payment = await prisma.venmoPayment.update({
    where: { id },
    data: { status: "rejected", rejectionNote: note },
    include: { booking: true },
  });

  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  const dollars = (payment.amount / 100).toFixed(2);

  try {
    await resend.emails.send({
      from,
      to: payment.booking.customerEmail,
      subject: "Payment issue — Lucy Evans Photography",
      html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
        <p>Hi ${payment.booking.customerName.split(" ")[0]},</p>
        <p>We weren't able to verify your Venmo payment of $${dollars}. ${note}</p>
        <p>Please reach out so we can sort this out — reply to this email or contact Lucy directly.</p>
        <p>— Lucy Evans</p>
      </div>`,
    });
  } catch (err) {
    console.error("[venmo reject] client email failed:", err);
  }

  revalidatePath("/admin/venmo-payments");
}
