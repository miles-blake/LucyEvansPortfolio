import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";
import { resend } from "@/lib/resend";

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const bookingId = (fd.get("bookingId") as string) || null;
  const orderId = (fd.get("orderId") as string) || null;
  const portalToken = (fd.get("portalToken") as string) || null;
  const amountStr = fd.get("amount") as string;
  const type = fd.get("type") as string;
  const file = fd.get("proof") as File | null;

  if ((!bookingId && !orderId) || !amountStr || !type || !file || file.size === 0) {
    return NextResponse.json({ error: "All fields including screenshot are required." }, { status: 400 });
  }

  let customerName = "";
  let customerEmail = "";

  // Validate target exists
  if (bookingId) {
    // If portal token provided, validate it
    if (portalToken) {
      const pt = await prisma.clientPortalToken.findUnique({
        where: { token: portalToken },
        include: { booking: { select: { id: true, customerName: true, customerEmail: true } } },
      });
      if (!pt || pt.booking.id !== bookingId || pt.expiresAt < new Date()) {
        return NextResponse.json({ error: "Invalid or expired portal link." }, { status: 403 });
      }
      customerName = pt.booking.customerName;
      customerEmail = pt.booking.customerEmail;
    } else {
      // Booking form submission — just verify booking exists and is recent (within 2h)
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { customerName: true, customerEmail: true, createdAt: true },
      });
      if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      if (booking.createdAt < twoHoursAgo) {
        return NextResponse.json({ error: "This link has expired. Please contact Lucy directly." }, { status: 403 });
      }
      customerName = booking.customerName;
      customerEmail = booking.customerEmail;
    }
  } else if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { customerName: true, customerEmail: true, status: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.status === "PAID") return NextResponse.json({ error: "This order is already paid." }, { status: 400 });
    customerName = order.customerName;
    customerEmail = order.customerEmail;
  }

  // Upload client screenshot
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
  const venmoPayment = await prisma.venmoPayment.create({
    data: {
      bookingId: bookingId ?? undefined,
      orderId: orderId ?? undefined,
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
  const subject = orderId
    ? `Venmo payment submitted — order by ${customerName}`
    : `Venmo deposit submitted — ${customerName}`;

  try {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject,
      html: `
        <h2>New Venmo payment to verify</h2>
        <p><strong>${customerName}</strong> has submitted a Venmo payment of <strong>$${dollars}</strong> (${type}).</p>
        <p>They've uploaded a screenshot as proof. Please verify and confirm or reject:</p>
        <p><a href="${siteUrl}/admin/venmo-payments#${venmoPayment.id}" style="color:#A9C6D8">Review this payment →</a></p>
      `,
    });
  } catch (err) {
    console.error("[venmo-payment] notification email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
