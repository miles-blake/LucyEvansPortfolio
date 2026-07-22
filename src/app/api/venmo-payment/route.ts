import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const bookingId = fd.get("bookingId") as string;
  const portalToken = fd.get("portalToken") as string;
  const amountStr = fd.get("amount") as string;
  const type = fd.get("type") as string;
  const file = fd.get("proof") as File | null;

  if (!bookingId || !portalToken || !amountStr || !type || !file || file.size === 0) {
    return NextResponse.json({ error: "All fields including screenshot are required." }, { status: 400 });
  }

  // Validate portal token belongs to this booking
  const pt = await prisma.clientPortalToken.findUnique({
    where: { token: portalToken },
    include: { booking: { select: { id: true, customerName: true, customerEmail: true } } },
  });
  if (!pt || pt.booking.id !== bookingId || pt.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired portal link." }, { status: 403 });
  }

  // Upload client screenshot to Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "venmo-proofs/client", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result as { secure_url: string });
      }
    ).end(buffer);
  });

  const amount = parseInt(amountStr);
  await prisma.venmoPayment.create({
    data: {
      bookingId,
      amount,
      type,
      clientProofUrl: uploadResult.secure_url,
      status: "pending",
    },
  });

  // Notify Lucy
  const siteUrl = process.env.NEXTAUTH_URL ?? "https://lucyevans.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@lucyevans.com";
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL ?? from;
  const dollars = (amount / 100).toFixed(2);

  try {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `Venmo payment submitted — ${pt.booking.customerName}`,
      html: `
        <h2>New Venmo payment to verify</h2>
        <p><strong>${pt.booking.customerName}</strong> has submitted a Venmo payment of <strong>$${dollars}</strong> (${type}).</p>
        <p>They've uploaded a screenshot as proof. Please verify the payment was received and confirm or reject:</p>
        <p><a href="${siteUrl}/admin/venmo-payments" style="color:#A9C6D8">Review in admin →</a></p>
      `,
    });
  } catch (err) {
    console.error("[venmo-payment] notification email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
