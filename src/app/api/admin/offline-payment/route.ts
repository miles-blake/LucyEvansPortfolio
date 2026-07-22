import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const fd = await req.formData();
  const bookingId = fd.get("bookingId") as string;
  const amountStr = fd.get("amount") as string;
  const method = fd.get("method") as string;
  const note = (fd.get("note") as string) || null;
  const file = fd.get("proof") as File | null;

  if (!bookingId || !amountStr || !method || !file || file.size === 0) {
    return NextResponse.json({ error: "All fields including proof are required." }, { status: 400 });
  }

  const amount = Math.round(parseFloat(amountStr) * 100);
  if (isNaN(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
  }

  // Upload proof to Cloudinary
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "payment-proofs", resource_type: "auto" },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result as { secure_url: string });
      }
    ).end(buffer);
  });

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { offlinePayments: true, depositPaid: true, depositAmount: true },
  });
  if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });

  const existing = (booking.offlinePayments as unknown[] | null) ?? [];
  const newPayment = {
    id: crypto.randomUUID(),
    method,
    amount,
    note,
    proofUrl: uploadResult.secure_url,
    recordedAt: new Date().toISOString(),
  };

  const totalOffline = [...existing, newPayment].reduce(
    (sum: number, p) => sum + ((p as { amount: number }).amount ?? 0),
    0
  );

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      offlinePayments: [...existing, newPayment] as object[],
      // Auto-mark deposit as paid if offline payments cover it
      ...(totalOffline >= booking.depositAmount && !booking.depositPaid
        ? { depositPaid: true }
        : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
