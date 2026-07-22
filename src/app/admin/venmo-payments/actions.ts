"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { cloudinary } from "@/lib/cloudinary";
import { resend } from "@/lib/resend";
import { signDownloadToken } from "@/lib/download-token";

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
}

export async function confirmVenmoPayment(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const file = formData.get("adminProof") as File | null;
  if (!file || file.size === 0) throw new Error("Admin proof screenshot is required.");

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
    include: {
      booking: true,
      order: { include: { items: { include: { photo: true, bundle: true } } } },
      invoice: true,
    },
  });

  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  const dollars = (payment.amount / 100).toFixed(2);

  // Booking deposit confirmation
  if (payment.booking) {
    await prisma.booking.update({ where: { id: payment.bookingId! }, data: { depositPaid: true } });

    const portalToken = await prisma.clientPortalToken.findUnique({
      where: { bookingId: payment.bookingId! },
      select: { token: true },
    });
    try {
      await resend.emails.send({
        from,
        to: payment.booking.customerEmail,
        subject: "Deposit confirmed — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${payment.booking.customerName.split(" ")[0]},</p>
          <p>Your Venmo deposit of <strong>$${dollars}</strong> has been confirmed — your date is secured!</p>
          ${portalToken ? `<p><a href="${siteUrl}/portal/${portalToken.token}" style="color:#A9C6D8">View your booking portal →</a></p>` : ""}
          <p>— Lucy Evans</p>
        </div>`,
      });
    } catch (err) { console.error("[venmo confirm booking] email failed:", err); }

    revalidatePath(`/admin/bookings/${payment.bookingId}`);
  }

  // Order payment confirmation — generate download tokens and email links
  if (payment.order) {
    const order = payment.order;

    await prisma.order.update({ where: { id: order.id }, data: { status: "PAID" } });

    const downloadLinks = order.items.map((item) => {
      const name = item.photo?.title ?? item.bundle?.title ?? "Download";
      const token = signDownloadToken(item.id);
      const signedUrl = `${siteUrl}/api/download/${item.id}?token=${token}`;
      return { name, signedUrl, orderItemId: item.id };
    });

    await Promise.all(
      downloadLinks.map(({ orderItemId, signedUrl }) =>
        prisma.orderItem.update({ where: { id: orderItemId }, data: { signedDownloadUrl: signedUrl } })
      )
    );

    try {
      await resend.emails.send({
        from,
        to: order.customerEmail,
        subject: "Your Lucy Evans download is ready",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <h2>Payment confirmed — your downloads are ready!</h2>
          <p>Hi ${order.customerName || "there"},</p>
          <p>Your Venmo payment of <strong>$${dollars}</strong> has been confirmed. Here are your download links:</p>
          <ul>
            ${downloadLinks.map(({ name, signedUrl }) => `<li><a href="${signedUrl}" style="color:#A9C6D8">${name}</a></li>`).join("")}
          </ul>
          <p><a href="${siteUrl}/order/${order.id}/confirmation" style="color:#A9C6D8">View your order →</a></p>
          <p style="font-size:12px;color:#888">Personal use only — not for resale or commercial use.</p>
        </div>`,
      });
    } catch (err) { console.error("[venmo confirm order] email failed:", err); }

    revalidatePath(`/admin/orders/${order.id}`);
  }

  // Invoice payment confirmation
  if (payment.invoice) {
    const invoice = payment.invoice;
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });

    try {
      await resend.emails.send({
        from,
        to: invoice.customerEmail,
        subject: `Invoice ${invoice.number} paid — Lucy Evans Photography`,
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${invoice.customerName.split(" ")[0]},</p>
          <p>Your Venmo payment of <strong>$${dollars}</strong> for invoice ${invoice.number} has been confirmed. Thank you!</p>
          <p>— Lucy Evans</p>
        </div>`,
      });
    } catch (err) { console.error("[venmo confirm invoice] email failed:", err); }

    revalidatePath(`/admin/invoices/${invoice.id}`);
  }

  revalidatePath("/admin/venmo-payments");
}

export async function rejectVenmoPayment(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id") as string;
  const note = (formData.get("note") as string) || "Payment could not be verified.";

  const payment = await prisma.venmoPayment.update({
    where: { id },
    data: { status: "rejected", rejectionNote: note },
    include: { booking: true, order: true, invoice: true },
  });

  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  const dollars = (payment.amount / 100).toFixed(2);
  const customerEmail = payment.booking?.customerEmail ?? payment.order?.customerEmail ?? payment.invoice?.customerEmail ?? "";
  const customerFirst = (payment.booking?.customerName ?? payment.order?.customerName ?? payment.invoice?.customerName ?? "there").split(" ")[0];

  if (customerEmail) {
    try {
      await resend.emails.send({
        from,
        to: customerEmail,
        subject: "Payment issue — Lucy Evans Photography",
        html: `<div style="font-family:sans-serif;max-width:600px;color:#2E2A24">
          <p>Hi ${customerFirst},</p>
          <p>We weren't able to verify your Venmo payment of $${dollars}. ${note}</p>
          <p>Please reach out so we can sort this out — reply to this email or contact Lucy directly.</p>
          <p>— Lucy Evans</p>
        </div>`,
      });
    } catch (err) { console.error("[venmo reject] email failed:", err); }
  }

  revalidatePath("/admin/venmo-payments");
}
